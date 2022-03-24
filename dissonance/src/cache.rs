use std::error::Error;

use redis::aio::Connection as RedisConnection;
use redis::AsyncCommands;

use tokio::sync::RwLock;
use tracing::warn;
use twilight_model::guild::Guild;
use twilight_model::id::marker::GuildMarker;
use twilight_model::id::Id;

/// Simple Result alias that returns any error.
type CacheResult<T> = Result<T, Box<dyn Error>>;

pub(crate) struct Cache(RwLock<RedisConnection>);

impl Cache {
    /// Connect to the redis server specified in the REDIS_URL
    /// environment variable and return a Cache instance that
    /// uses it.
    pub async fn connect() -> CacheResult<Cache> {
        let redis = redis::Client::open(format!("redis://{}/", std::env::var("REDIS_URL")?))?;
        let conn = redis.get_async_connection().await?;

        Ok(Cache(RwLock::new(conn)))
    }

    /// Inserts or updates the given guild in the redis cache. This will
    /// serialize the Guild to JSON, with the exception of the members,
    /// presences and voice states. Note that this will also ensure
    /// upserting of individual channels.
    pub async fn upsert_guild(self: &Cache, guild: &Guild) -> CacheResult<()> {
        let mut conn = self.0.write().await;

        // We need to create a copy of the guild that zeros out some of the
        // stuff we're not interested in.
        let mut guild = guild.clone();
        guild.members = vec![];
        guild.voice_states = vec![];
        guild.presences = vec![];

        conn.set(
            format!("dissonance:guild:{}", guild.id.get()),
            &serde_json::to_string(&guild)?,
        )
        .await?;

        Ok(())
    }

    /// Attempts to fetch current information for the guild with the given ID
    /// from the cache. If successful, invokes the given update function and
    /// writes the result back to the cache. If not successful, issues a
    /// warning and does nothing.
    pub async fn update_guild<F>(
        self: &Cache,
        guild_id: Id<GuildMarker>,
        update: F,
    ) -> CacheResult<()>
    where
        F: FnOnce(&mut Guild),
    {
        let mut conn = self.0.write().await;

        let entry = conn
            .get::<String, String>(format!("dissonance:guild:{}", guild_id.get()))
            .await;

        // Drop lock here so we don't hold it while we parse and update.
        std::mem::drop(conn);

        match entry {
            Err(_) => warn!(
                "Update for guild {} failed: it was not in the cache.",
                guild_id.get()
            ),
            Ok(content) => {
                let mut guild = serde_json::from_str::<Guild>(&content)?;
                update(&mut guild);

                // Reacquire lock.
                let mut conn = self.0.write().await;

                conn.set(
                    format!("dissonance:guild:{}", guild.id.get()),
                    &serde_json::to_string(&guild)?,
                )
                .await?;
            }
        };

        Ok(())
    }

    /// Deletes the specified guild from the redis cache, including all
    /// channels that belonged to it.
    pub async fn delete_guild(self: &Cache, guild_id: Id<GuildMarker>) -> CacheResult<()> {
        let mut conn = self.0.write().await;

        conn.del(format!("dissonance:guild:{}", guild_id.get()))
            .await?;

        Ok(())
    }
}
