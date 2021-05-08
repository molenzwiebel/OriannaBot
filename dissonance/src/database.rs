use std::{collections::HashSet, error::Error};

use sqlx::{postgres::PgPoolOptions, types::Json, PgPool};
use twilight_model::{
    guild::Member,
    id::{GuildId, RoleId, UserId},
};

/// Simple Result alias that returns any error.
type DBResult<T> = Result<T, Box<dyn Error>>;

pub(crate) struct Database(PgPool);

impl Database {
    /// Connect to the database specified in the DATABASE_URL
    /// environment variable and attempt to perform migrations.
    pub async fn connect() -> DBResult<Database> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&std::env::var("DATABASE_URL")?)
            .await?;

        Ok(Database(pool))
    }

    /// Resets all stored information on the given guild. This should be invoked
    /// just before a guild upsert is done after a guild is newly received from
    /// the gateway, as we can be sure that that data is the newest available.
    pub async fn reset_guild(self: &Database, guild_id: GuildId) -> DBResult<()> {
        sqlx::query!(
            r#"
                DELETE FROM guild_members WHERE guild_id = $1
            "#,
            guild_id.0 as i64
        )
        .execute(&self.0)
        .await?;

        Ok(())
    }

    /// Takes the specified set of members and will batch upsert them into the
    /// database with a single operation. Whenever some member already exists,
    /// their values are updated instead.
    pub async fn upsert_batch_members<'a, T>(
        self: &Database,
        guild: GuildId,
        members: T,
    ) -> DBResult<()>
    where
        T: Iterator<Item = &'a Member>,
    {
        let mut ids = vec![];
        let mut nicks = vec![];
        let mut roles = vec![];

        // Members can be duplicate in a single chunk if we're receiving it directly
        // from a guild creation event, in the case where they are in voice at the
        // same time. This is "intentional" behavior, as per
        // https://github.com/discord/discord-api-docs/issues/997.
        //
        // Postgres does not like upsert statements with duplicate entries, so we
        // need to filter them out here.
        let mut seen = HashSet::new();

        for member in members {
            if seen.contains(&member.user.id.0) {
                continue;
            }

            ids.push(member.user.id.0 as i64);
            seen.insert(member.user.id.0);
            nicks.push(member.nick.clone());
            roles.push(Json(member.roles.clone()));
        }

        sqlx::query(
            r#"
            INSERT INTO guild_members (guild_id, user_id, nickname, roles)
            SELECT $1, * FROM unnest($2, $3, $4)
            ON CONFLICT (guild_id, user_id) DO UPDATE SET user_id = EXCLUDED.user_id, nickname = EXCLUDED.nickname, roles = EXCLUDED.roles
            "#
        )
          .bind(guild.0 as i64)
          .bind(ids.as_slice())
          .bind(nicks.as_slice())
          .bind(roles.as_slice())
          .execute(&self.0)
          .await?;

        Ok(())
    }

    /// Takes the specified member and inserts or updates the nickname and
    /// roles of the user on the given server.
    pub async fn upsert_member(
        self: &Database,
        guild_id: GuildId,
        user_id: UserId,
        nick: &Option<String>,
        roles: &Vec<RoleId>,
    ) -> Result<(), Box<dyn Error>> {
        sqlx::query!(
            r#"
            INSERT INTO guild_members (guild_id, user_id, nickname, roles)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (guild_id, user_id) DO UPDATE SET user_id = EXCLUDED.user_id, nickname = EXCLUDED.nickname, roles = EXCLUDED.roles
        "#,
            guild_id.0 as i64,
            user_id.0 as i64,
            nick.clone(),
            Json(roles) as _
        ).execute(&self.0).await?;

        Ok(())
    }

    /// Removes the membership of the given member on the given server.
    pub async fn remove_member(
        self: &Database,
        guild_id: GuildId,
        user_id: UserId,
    ) -> Result<(), Box<dyn Error>> {
        sqlx::query!(
            r#"
            DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2
        "#,
            guild_id.0 as i64,
            user_id.0 as i64,
        )
        .execute(&self.0)
        .await?;

        Ok(())
    }
}
