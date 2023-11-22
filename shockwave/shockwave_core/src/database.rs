use std::ops::DerefMut;

use itertools::Itertools;
use sqlx::{
    pool::PoolConnection,
    postgres::{PgPoolOptions, PgRow},
    Executor, PgPool, Postgres, Row,
};

use crate::{
    db_model::{LeagueAccount, Role, ServerAndUserPresence, User, UserChampionStat, UserRank},
    evaluate::EvaluationContext,
    role_model::RoleConditionWithId,
    util::DynError,
};

/// Simple Result alias that returns any error.
type DBResult<T = ()> = Result<T, DynError>;

pub type Connection = PoolConnection<Postgres>;

pub struct Database(pub PgPool);

impl Database {
    /// Connect to the database specified in the DATABASE_URL
    /// environment variable and attempt to perform migrations.
    pub async fn connect(num_conns: u32) -> DBResult<Database> {
        let pool = PgPoolOptions::new()
            .max_connections(num_conns)
            .min_connections(num_conns)
            .test_before_acquire(false)
            .connect(&std::env::var("DATABASE_URL")?)
            .await?;

        Ok(Database(pool))
    }

    /// Retrieve a new connection from the connection pool contained in this
    /// object.
    #[tracing::instrument(skip(self))]
    pub async fn get_connection(&self) -> DBResult<Connection> {
        Ok(self.0.acquire().await?)
    }

    /// Find the `amount` updates whose `column_name` was least recently updated and
    /// return a list of their IDs.
    pub async fn find_lru_users(&self, column_name: &str, amount: i32) -> DBResult<Vec<i32>> {
        Ok(sqlx::query(&format!(
            "SELECT id FROM users WHERE has_accounts=true ORDER BY {} ASC NULLS LAST LIMIT $1",
            column_name
        ))
        .bind(amount)
        .map(|x: PgRow| x.get::<i32, _>("id"))
        .fetch_all(&self.0)
        .await?)
    }

    /// Find amount users starting at offset, with at least one account.
    pub async fn find_users(&self, amount: u32, offset: u32, temp_hack: bool) -> DBResult<Vec<i32>> {
        let query = if temp_hack {
            "SELECT user_id as id FROM temp_users ORDER BY id ASC NULLS LAST LIMIT $1 OFFSET $2"
        } else {
            "SELECT id FROM users WHERE has_accounts=true ORDER BY id ASC NULLS LAST LIMIT $1 OFFSET $2"
        };

        Ok(sqlx::query(query)
            .bind(amount as i32)
            .bind(offset as i32)
            .map(|x: PgRow| x.get::<i32, _>("id"))
            .fetch_all(&self.0)
            .await?)
    }

    /// Batch retrieve matching evaluation contexts for the list of ids.
    /// Note that the results are not guaranteed to be in the same order
    /// as the ids.
    pub async fn get_batch_evaluation_context(&self, user_ids: Vec<i32>) -> DBResult<Vec<EvaluationContext>> {
        let users =
            sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ANY($1)").bind(&user_ids).fetch_all(&self.0);

        let accounts = sqlx::query_as::<_, LeagueAccount>("SELECT * FROM league_accounts WHERE user_id = ANY($1)")
            .bind(&user_ids)
            .fetch_all(&self.0);

        let ranks = sqlx::query_as::<_, UserRank>("SELECT * FROM user_ranks WHERE user_id = ANY($1)")
            .bind(&user_ids)
            .fetch_all(&self.0);

        let stats = sqlx::query_as::<_, UserChampionStat>("SELECT * FROM user_champion_stats WHERE user_id = ANY($1)")
            .bind(&user_ids)
            .fetch_all(&self.0);

        let (users, mut accounts, mut ranks, mut stats) = futures::try_join!(users, accounts, ranks, stats)?;

        let mut ret = vec![];

        for user in users {
            ret.push(EvaluationContext {
                accounts: accounts.extract_if(|x| x.user_id == user.id).collect(),
                ranks: ranks.extract_if(|x| x.user_id == user.id).collect(),
                stats: stats.extract_if(|x| x.user_id == user.id).collect(),
                user,
            });
        }

        Ok(ret)
    }

    /// Update the timestamp for the given update type and the given user ID to the
    /// current time.
    pub async fn update_fetch_timestamp(&self, user_id: i32, column_name: &str) -> DBResult {
        sqlx::query(&format!(
            "UPDATE users SET {} = (extract(EPOCH FROM now()) * 1000)::bigint WHERE id = $1",
            column_name
        ))
        .bind(user_id)
        .execute(&self.0)
        .await?;

        Ok(())
    }

    /// Update the timestamp for the given update type and the given user ID to the
    /// current time.
    pub async fn update_fetch_timestamp_with_connection(
        &self,
        conn: &mut Connection,
        user_id: i32,
        column_name: &str,
    ) -> DBResult {
        sqlx::query(&format!(
            "UPDATE users SET {} = (extract(EPOCH FROM now()) * 1000)::bigint WHERE id = $1",
            column_name
        ))
        .bind(user_id)
        .execute(conn.deref_mut())
        .await?;

        Ok(())
    }

    /// Clear the snowflake for the role with the given ID. We do this when we get
    /// an error from discord stating that the role is not found. This is to prevent
    /// other attempts from assigning the role and consistently failing.
    pub async fn clear_snowflake_for_role(&self, role_id: i32) -> DBResult {
        sqlx::query!("UPDATE roles SET snowflake = '' WHERE id = $1", role_id).execute(&self.0).await?;

        Ok(())
    }

    /// Upsert a set of champion statistics for the given user. The argument is a set
    /// of tuples that represent `(champion id, level, points)` for that champion.
    #[tracing::instrument(skip(self, user_id, stats))]
    #[inline]
    pub async fn upsert_user_stats(&self, conn: &mut Connection, user_id: i32, stats: &[(i32, i32, i32)]) -> DBResult {
        if stats.is_empty() {
            return Ok(());
        }

        let champs: Vec<_> = stats.iter().map(|x| x.0).collect();
        let levels: Vec<_> = stats.iter().map(|x| x.1).collect();
        let points: Vec<_> = stats.iter().map(|x| x.2).collect();

        sqlx::query(
            r#"
            INSERT INTO user_champion_stats (user_id, champion_id, level, score)
            SELECT $1, * FROM unnest($2, $3, $4)
            ON CONFLICT (user_id, champion_id) DO UPDATE SET
                user_id = EXCLUDED.user_id, champion_id = EXCLUDED.champion_id,
                level = EXCLUDED.level, score = EXCLUDED.score
            "#,
        )
        .bind(user_id)
        .bind(champs.as_slice())
        .bind(levels.as_slice())
        .bind(points.as_slice())
        .execute(conn.deref_mut())
        .await?;

        Ok(())
    }

    /// Inserts a set of user mastery delta entries for the given user. The provided
    /// argument should be a list of `(champion id, new points, delta)` triplets.
    #[tracing::instrument(skip(self, user_id, deltas))]
    #[inline]
    pub async fn insert_user_mastery_deltas(
        &self,
        conn: &mut Connection,
        user_id: i32,
        deltas: &[(i32, i32, i32)],
    ) -> DBResult {
        if deltas.is_empty() {
            return Ok(());
        }

        let champs: Vec<_> = deltas.iter().map(|x| x.0).collect();
        let points: Vec<_> = deltas.iter().map(|x| x.1).collect();
        let deltas: Vec<_> = deltas.iter().map(|x| x.2).collect();

        sqlx::query(
            r#"
            INSERT INTO user_mastery_deltas_ts (user_id, timestamp, champion_id, value, delta)
            SELECT $1, NOW(), * FROM unnest($2, $3, $4)
            "#,
        )
        .bind(user_id)
        .bind(champs.as_slice())
        .bind(points.as_slice())
        .bind(deltas.as_slice())
        .execute(conn.deref_mut())
        .await?;

        Ok(())
    }

    /// Removes all stats for the given user for all champion ids given.
    #[tracing::instrument(skip(self, user_id, ids))]
    #[inline]
    pub async fn remove_user_stats_for_champions(&self, conn: &mut Connection, user_id: i32, ids: &[i32]) -> DBResult {
        if ids.is_empty() {
            return Ok(());
        }

        sqlx::query("DELETE FROM user_champion_stats WHERE user_id = $1 AND champion_id = ANY($2)")
            .bind(user_id)
            .bind(ids)
            .execute(conn.deref_mut())
            .await?;

        Ok(())
    }

    /// Fetches all the user statistics for the user with the given ID.
    #[tracing::instrument(skip(self, user_id))]
    #[inline]
    pub async fn get_user_ranks(&self, user_id: i32) -> DBResult<Vec<UserRank>> {
        Ok(sqlx::query_as::<_, UserRank>("SELECT * FROM user_ranks WHERE user_id = $1")
            .bind(user_id)
            .fetch_all(&self.0)
            .await?)
    }

    /// Fetches all the user statistics for the user with the given ID.
    #[tracing::instrument(skip(self, user_id))]
    #[inline]
    pub async fn get_user_stats(&self, user_id: i32) -> DBResult<Vec<UserChampionStat>> {
        Ok(sqlx::query_as::<_, UserChampionStat>("SELECT * FROM user_champion_stats WHERE user_id = $1")
            .bind(user_id)
            .fetch_all(&self.0)
            .await?)
    }

    /// Fetches all the accounts linked for the user with the given ID.
    #[tracing::instrument(skip(self, user_id))]
    #[inline]
    pub async fn get_user_accounts(&self, user_id: i32) -> DBResult<Vec<LeagueAccount>> {
        Ok(sqlx::query_as::<_, LeagueAccount>("SELECT * FROM league_accounts WHERE user_id = $1")
            .bind(user_id)
            .fetch_all(&self.0)
            .await?)
    }

    /// Update the rank for the given user to the given tier in the given queue.
    #[tracing::instrument(skip(self, queue, tier))]
    #[inline]
    pub async fn update_user_rank(&self, user_id: i32, queue: &str, tier: &str) -> DBResult {
        sqlx::query("UPDATE user_ranks SET tier=$1 WHERE user_id=$2 AND queue=$3")
            .bind(tier)
            .bind(user_id)
            .bind(queue)
            .execute(&self.0)
            .await?;

        Ok(())
    }

    /// Pre-emptively insert a role for the given discord user, so that we don't
    /// repeatedly attempt to assign roles for that user even when they already
    /// have that role. This will only insert if there isn't already an entry.
    #[tracing::instrument(skip(self, user_id, guild_id, role_id))]
    #[inline]
    pub async fn insert_discord_member_role(&self, user_id: u64, guild_id: u64, role_id: u64) -> DBResult {
        sqlx::query(&format!(
            "UPDATE guild_members SET roles = roles || '[\"{}\"]'::jsonb WHERE user_id = {} AND guild_id = {} AND NOT roles ? '{}'",
            role_id, user_id, guild_id, role_id
        ))
        .execute(&self.0)
        .await?;

        Ok(())
    }

    /// Add the rank for the given user with the given tier in the given queue.
    #[tracing::instrument(skip(self, user_id, queue, tier))]
    #[inline]
    pub async fn insert_user_rank(&self, user_id: i32, queue: &str, tier: &str) -> DBResult {
        sqlx::query("INSERT INTO user_ranks (user_id, queue, tier) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(queue)
            .bind(tier)
            .execute(&self.0)
            .await?;

        Ok(())
    }

    /// Remove the rank for the given user in the given queue.
    #[tracing::instrument(skip(self, user_id, queue))]
    #[inline]
    pub async fn remove_user_rank(&self, user_id: i32, queue: &str) -> DBResult {
        sqlx::query("DELETE FROM user_ranks WHERE user_id = $1 AND queue = $2")
            .bind(user_id)
            .bind(queue)
            .execute(&self.0)
            .await?;

        Ok(())
    }

    /// Delete the account with the specified ID, then update the user record
    /// to ensure that the `has_accounts` value stays in sync.
    #[tracing::instrument(skip(self, user_id, account_id))]
    #[inline]
    pub async fn remove_account(&self, user_id: i32, account_id: i32) -> DBResult {
        // Needs to be two queries as we cannot multiple queries in a prepared statement.
        sqlx::query("DELETE FROM league_accounts WHERE id = $1;").bind(account_id).execute(&self.0).await?;

        sqlx::query("UPDATE users SET has_accounts = (SELECT count(*) FROM league_accounts WHERE user_id = $1) > 0 WHERE id = $1;")
        .bind(user_id)
        .execute(&self.0)
        .await?;

        Ok(())
    }

    /// Update the stored username for the league account with the given ID.
    #[tracing::instrument(skip(self, account_id, new_name))]
    #[inline]
    pub async fn update_account_username(&self, account_id: i32, new_name: String) -> DBResult {
        sqlx::query("UPDATE league_accounts SET username = $1 WHERE id = $2")
            .bind(new_name)
            .bind(account_id)
            .execute(&self.0)
            .await?;

        Ok(())
    }

    /// Update the stored Riot ID for the league account with the given ID.
    #[tracing::instrument(skip(self, account_id, game_name, tagline))]
    #[inline]
    pub async fn update_account_riot_id(
        &self,
        account_id: i32,
        game_name: Option<String>,
        tagline: Option<String>,
    ) -> DBResult {
        sqlx::query("UPDATE league_accounts SET riot_id_game_name = $1, riot_id_tagline = $2 WHERE id = $3")
            .bind(game_name)
            .bind(tagline)
            .bind(account_id)
            .execute(&self.0)
            .await?;

        Ok(())
    }

    /// Query all role conditions for the server with the given ID.
    #[tracing::instrument(skip(self, server_id))]
    #[inline]
    pub async fn get_roles_and_conditions_for_server(
        &self,
        server_id: i32,
    ) -> DBResult<Vec<(Role, Vec<RoleConditionWithId>)>> {
        let mut roles = self.get_roles_in_server(server_id).await?;

        let conditions = sqlx::query!(
            r#"
                SELECT
                    json_build_object('id', role_conditions.id, 'role_id', role_id, 'type', type, 'options', options)::text as json
                FROM role_conditions
                WHERE role_id IN (SELECT * FROM unnest($1::int[]))
            "#,
            &roles.iter().map(|x| x.id).collect::<Vec<i32>>()
        )
        .fetch_all(&self.0)
        .await?
        .into_iter()
        .filter_map(|r| {
            serde_json::from_str::<RoleConditionWithId>(&r.json.expect("No json in result column")).ok()
        })
        .collect::<Vec<_>>();

        Ok(conditions
            .into_iter()
            .group_by(|x| x.role_id)
            .into_iter()
            .map(|(role_id, conditions)| {
                let role_pos =
                    roles.iter().position(|x| x.id == role_id).expect("Role wasn't returned from first call?");

                let role = roles.swap_remove(role_pos);

                (role, conditions.collect())
            })
            .collect())
    }

    /// Get the evaluation context for the user with the specified ID,
    /// including all the information needed for the given set of conditions.
    #[tracing::instrument(skip(self, user_id))]
    #[inline]
    pub async fn get_evaluation_context(&self, user_id: i32) -> DBResult<EvaluationContext> {
        let mut conn = self.get_connection().await?;

        Ok(EvaluationContext {
            user: sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1 LIMIT 1")
                .bind(user_id)
                .fetch_one(conn.deref_mut())
                .await?,
            accounts: sqlx::query_as::<_, LeagueAccount>("SELECT * FROM league_accounts WHERE user_id = $1")
                .bind(user_id)
                .fetch_all(conn.deref_mut())
                .await?,
            ranks: sqlx::query_as::<_, UserRank>("SELECT * FROM user_ranks WHERE user_id = $1")
                .bind(user_id)
                .fetch_all(conn.deref_mut())
                .await?,
            stats: sqlx::query_as::<_, UserChampionStat>("SELECT * FROM user_champion_stats WHERE user_id = $1")
                .bind(user_id)
                .fetch_all(conn.deref_mut())
                .await?,
        })
    }

    /// Find all the roles in the server with the given ID.
    #[tracing::instrument(skip(self, id))]
    #[inline]
    pub async fn get_roles_in_server(&self, id: i32) -> DBResult<Vec<Role>> {
        Ok(sqlx::query_as::<_, Role>(
            r#"
            SELECT * FROM roles WHERE server_id = $1
        "#,
        )
        .bind(id)
        .fetch_all(&self.0)
        .await?)
    }

    /// Find all the servers that the user with the given snowflake is on.
    #[tracing::instrument(skip(self, user_snowflake))]
    #[inline]
    pub async fn get_servers_with_user(&self, user_snowflake: String) -> DBResult<Vec<ServerAndUserPresence>> {
        Ok(sqlx::query_as::<_, ServerAndUserPresence>(
            r#"
            SELECT servers.*, guild_members.roles, guild_members.nickname
            FROM guild_members
            JOIN servers ON servers.snowflake::bigint = guild_members.guild_id
            WHERE user_id=$1::bigint
        "#,
        )
        .bind(user_snowflake)
        .fetch_all(&self.0)
        .await?)
    }
}

/// Query builder that allows multiple queries to be built and then executed at
/// the same time. These functions will ensure that all values are sanitized and
/// will ensure that connections are only made if needed.
pub struct BatchQueryBuilder(Vec<String>);

impl BatchQueryBuilder {
    pub fn new() -> BatchQueryBuilder {
        BatchQueryBuilder(vec![])
    }

    /// Update or insert a leaderboard entry for the given user in the given table.
    pub fn upsert_user_in_leaderboard(
        &mut self,
        user_id: i32,
        leaderboard_id: String,
        (champion_id, level, points): (i32, i32, i32),
    ) {
        self.0.push(format!(
            r#"
            INSERT INTO leaderboard_{} (user_id, level, score, champion_id)
            VALUES ({}, {}, {}, {})
            ON CONFLICT (user_id) DO UPDATE SET
                user_id = EXCLUDED.user_id, level = EXCLUDED.level,
                score = EXCLUDED.score, champion_id = EXCLUDED.champion_id"#,
            leaderboard_id, user_id, level, points, champion_id
        ));
    }

    /// Remove the user entry from the given leaderboard (either numerical champion ID or "all"),
    /// if they had an entry on that leaderboard.
    pub fn remove_user_from_leaderboard(&mut self, user_id: i32, leaderboard_id: &str) {
        self.0.push(format!("DELETE FROM leaderboard_{} WHERE user_id = {}", leaderboard_id, user_id));
    }

    /// Execute all queries stored in this batch query builder. This will consume
    /// the builder to ensure that it is not accidentally reused.
    #[tracing::instrument(name = "batch_query_builder_execute", skip(self))]
    #[inline]
    pub async fn execute(self, conn: &mut Connection) -> DBResult {
        if self.0.is_empty() {
            return Ok(());
        }

        let query = self.0.iter().join("; ");
        conn.execute(&query[..]).await?;

        Ok(())
    }
}
