use std::{
    error::Error,
    sync::{atomic::AtomicUsize, Arc},
    time::{Duration, Instant},
};

use dashmap::DashMap;
use futures::StreamExt;
use tokio::{sync::mpsc, time::MissedTickBehavior};
use tracing::{debug, info, warn};
use twilight_gateway::{
    stream::{self, ShardMessageStream},
    ConfigBuilder, Event, EventTypeFlags, Intents, Message, MessageSender, Shard,
};
use twilight_http::Client;
use twilight_model::{
    gateway::{
        payload::{
            incoming::MemberChunk,
            outgoing::{
                update_presence::UpdatePresencePayload, RequestGuildMembers, UpdatePresence,
            },
        },
        presence::{Activity, ActivityType, MinimalActivity, Status},
    },
    guild::Guild,
    id::{marker::GuildMarker, Id},
};

use crate::{cache::Cache, database::Database, forwarder::Forwarder};

type VoidResult = Result<(), Box<dyn Error>>;

const VERSION: &str = compile_time_run::run_command_str!("git", "log", "--format=%h - %s", "-n 1");

const STATUSES: &[(ActivityType, &'static str)] = &[
    (ActivityType::Playing, "Command: Shockwave"),
    (ActivityType::Playing, "on-hit Orianna"),
    (ActivityType::Playing, "with the Ball"),
    (ActivityType::Competing, "the LCS"),
    (ActivityType::Listening, "time ticking away"),
    (ActivityType::Watching, "my enemies shiver"),
    (ActivityType::Watching, "you"),
    (ActivityType::Competing, "the LEC"),
    (ActivityType::Watching, "Piltovan theater"),
    (ActivityType::Playing, "Command: Protect"),
    (ActivityType::Listening, "Running in the 90s"),
    (ActivityType::Playing, "with Stopwatch"),
    (ActivityType::Watching, "LoLEsports"),
    (ActivityType::Competing, "the LCK"),
    (ActivityType::Listening, "them scream"),
    (ActivityType::Watching, "what makes them tick"),
    (ActivityType::Playing, "Command: Attack"),
    (ActivityType::Competing, "the LPL"),
    (ActivityType::Playing, "Command: Dissonance"),
    (ActivityType::Watching, "botlane feed"),
];

pub(crate) struct Worker {
    db: Database,
    shards: Option<Vec<Shard>>,
    shard_senders: Vec<MessageSender>,
    cache: Cache,
    forwarder: Forwarder,
    outstanding_member_requests: DashMap<Id<GuildMarker>, Instant>,

    outstanding_count: AtomicUsize,
    guild_member_tx: mpsc::UnboundedSender<(u64, Id<GuildMarker>)>,
    guild_member_rx: Option<mpsc::UnboundedReceiver<(u64, Id<GuildMarker>)>>,
}

macro_rules! handle_event {
    ($event:literal, $body:expr) => {
        tokio::spawn(async move {
            match $body {
                Err(e) => warn!(concat!("Error handling event ", $event, ": {:?}"), e),
                _ => {}
            };
        });
    };
}

impl Worker {
    pub async fn new() -> Result<Worker, Box<dyn Error>> {
        let intents = Intents::GUILDS
            | Intents::GUILD_MESSAGES
            | Intents::GUILD_MEMBERS
            | Intents::GUILD_MESSAGES
            | Intents::GUILD_MESSAGE_REACTIONS
            | Intents::DIRECT_MESSAGES
            | Intents::DIRECT_MESSAGE_REACTIONS;

        let token = std::env::var("DISCORD_TOKEN")?;
        let client = Client::new(token.clone());
        let config = ConfigBuilder::new(token, intents)
            .presence(UpdatePresencePayload::new(
                vec![STATUSES[0].to_activity()],
                false,
                None,
                Status::Online,
            )?)
            .build();

        let shards = stream::create_recommended(&client, config, |_, b| b.build())
            .await?
            .collect::<Vec<_>>();
        info!("Created {} shards", shards.len());

        let shard_senders = shards.iter().map(|s| s.sender()).collect();

        let db = Database::connect().await?;
        info!("Connected to database");

        let cache = Cache::connect().await?;
        info!("Connected to cache");

        let forwarder = Forwarder::connect().await?;
        info!("Connected to forwarder");

        let (tx, rx) = mpsc::unbounded_channel();

        Ok(Worker {
            db,
            shards: Some(shards),
            shard_senders,
            cache,
            forwarder,
            outstanding_member_requests: DashMap::new(),

            outstanding_count: AtomicUsize::new(0),
            guild_member_tx: tx,
            guild_member_rx: Some(rx),
        })
    }

    pub async fn run(mut self: Worker) {
        let mut shards = self.shards.take().unwrap();
        let member_rx = self.guild_member_rx.take().unwrap();

        let arc = Arc::new(self);
        let self_status = arc.clone();
        let self_presence_requests = arc.clone();

        // Start rotating presence on a separate worker.
        tokio::spawn(async move {
            self_status.presence_loop().await;
        });

        // Within yet another worker, handle the member presence queries that will arrive
        // in the MPSC channel. These are centralized so we can locally rate limit, since
        // it seems either Twilight or Discord struggle if we send a request as soon as
        // we receive the startup message.
        tokio::spawn(async move {
            self_presence_requests.member_request_loop(member_rx).await;
        });

        let mut message_stream = ShardMessageStream::new(shards.iter_mut());

        while let Some((shard_id, event)) = message_stream.next().await {
            let shard_id = shard_id.id().number();
            match event {
                Ok(msg) => {
                    if let Err(e) = arc.clone().handle_message(shard_id, msg) {
                        warn!("Error handling event on shard {}: {:?}", shard_id, e);
                    }
                }
                Err(_) => {
                    warn!("Error receiving message from shard {}", shard_id);
                }
            }
        }
    }

    /// Handles a single message received from the gateway. A message will be forwarded
    /// to the AMQP broker, and potentially parsed and handled on the dissonance side
    /// as well.
    #[inline(always)]
    fn handle_message(self: Arc<Worker>, shard: u64, message: Message) -> VoidResult {
        match message {
            Message::Close(_) => {}
            Message::Text(msg) => {
                // forward to AMQP (if necessary)
                let worker_clone = self.clone();
                let forwarded_msg = msg.clone();
                handle_event!(
                    "ShardPayload",
                    worker_clone
                        .clone()
                        .forwarder
                        .try_forward(&worker_clone, shard, &forwarded_msg)
                        .await
                );

                // parse, then hand off to the event handler
                match twilight_gateway::parse(
                    msg,
                    EventTypeFlags::READY
                        | EventTypeFlags::GUILD_CREATE
                        | EventTypeFlags::GUILD_UPDATE
                        | EventTypeFlags::GUILD_DELETE
                        | EventTypeFlags::ROLE_CREATE
                        | EventTypeFlags::ROLE_UPDATE
                        | EventTypeFlags::ROLE_DELETE
                        | EventTypeFlags::CHANNEL_CREATE
                        | EventTypeFlags::CHANNEL_UPDATE
                        | EventTypeFlags::CHANNEL_DELETE
                        | EventTypeFlags::MEMBER_ADD
                        | EventTypeFlags::MEMBER_UPDATE
                        | EventTypeFlags::MEMBER_REMOVE
                        | EventTypeFlags::MEMBER_CHUNK,
                ) {
                    Ok(Some(ev)) => {
                        let _ = self.handle_event(shard, ev.into());
                    }
                    Ok(None) => {
                        // ignore; we don't care about this event
                    }
                    Err(_) => {
                        // ignore; likely an unsupported discord gateway event
                    }
                };
            }
        };

        Ok(())
    }

    /// Handles a single event received from the gateway. Note that not all events
    /// possible are emitted here. In particular, events need to be included in both
    /// the intents and the event type flags in order for them to show up here.
    ///
    /// Note: this function is explicitly not async as to force usage of tokio::spawn
    /// whenever anything IO-related needs to happen. This is because this function is
    /// called inside the hot event loop and as a result needs to never block the task.
    #[inline(always)]
    fn handle_event(self: Arc<Worker>, shard: u64, event: Event) -> VoidResult {
        match event {
            Event::Ready(ready) => {
                info!("Shard {} ready with {} guilds!", shard, ready.guilds.len());
            }

            Event::GuildCreate(guild) => {
                handle_event!(
                    "GuildCreate",
                    self.handle_guild_created(&guild, shard).await
                );
            }

            Event::GuildUpdate(guild) => {
                handle_event!(
                    "GuildUpdate",
                    self.cache
                        .update_guild(guild.id, |g| {
                            // Partial update, only these should really be used by us anyway.
                            g.name = guild.name.clone();
                            g.icon = guild.icon.clone();
                            g.owner_id = guild.owner_id;
                        })
                        .await
                );
            }

            // If unavailable is false, it means we got kicked. Otherwise we don't care.
            Event::GuildDelete(guild) if !guild.unavailable => {
                handle_event!("GuildDelete", self.handle_guild_deleted(guild.id).await);
            }

            Event::RoleCreate(role) => {
                handle_event!(
                    "RoleCreate",
                    self.cache
                        .update_guild(role.guild_id, |g| {
                            g.roles.push(role.role);
                        })
                        .await
                );
            }

            Event::RoleUpdate(role) => {
                handle_event!(
                    "RoleUpdate",
                    self.cache
                        .update_guild(role.guild_id, |g| {
                            g.roles
                                .iter_mut()
                                .filter(|g| g.id == role.role.id)
                                .for_each(|r| {
                                    *r = role.role.clone();
                                });
                        })
                        .await
                );
            }

            Event::RoleDelete(role) => {
                handle_event!(
                    "RoleDelete",
                    self.cache
                        .update_guild(role.guild_id, |g| {
                            g.roles.retain(|x| x.id != role.role_id);
                        })
                        .await
                );
            }

            Event::ChannelCreate(channel_create) if channel_create.guild_id.is_some() => {
                handle_event!(
                    "ChannelCreate",
                    self.cache
                        .update_guild(channel_create.guild_id.unwrap(), |g| {
                            g.channels.push(channel_create.0);
                        })
                        .await
                );
            }

            Event::ChannelUpdate(channel_update) if channel_update.guild_id.is_some() => {
                handle_event!(
                    "ChannelUpdate",
                    self.cache
                        .update_guild(channel_update.guild_id.unwrap(), |g| {
                            g.channels
                                .iter_mut()
                                .filter(|g| g.id == channel_update.0.id)
                                .for_each(|c| {
                                    *c = channel_update.0.clone();
                                });
                        })
                        .await
                );
            }

            Event::ChannelDelete(channel_delete) if channel_delete.guild_id.is_some() => {
                handle_event!(
                    "ChannelDelete",
                    self.cache
                        .update_guild(channel_delete.guild_id.unwrap(), |g| {
                            g.channels.retain(|x| x.id != channel_delete.0.id);
                        })
                        .await
                );
            }

            Event::MemberAdd(member) => {
                handle_event!(
                    "MemberAdd",
                    self.db
                        .upsert_member(member.guild_id, member.user.id, &member.nick, &member.roles)
                        .await
                );
            }

            Event::MemberUpdate(update) => {
                handle_event!(
                    "MemberUpdate",
                    self.db
                        .upsert_member(update.guild_id, update.user.id, &update.nick, &update.roles)
                        .await
                );
            }

            Event::MemberRemove(removal) => {
                handle_event!(
                    "MemberRemove",
                    self.db
                        .remove_member(removal.guild_id, removal.user.id)
                        .await
                );
            }

            Event::MemberChunk(chunk) => {
                handle_event!("MemberChunk", self.handle_member_chunk(&chunk).await);
            }

            _ => {}
        };

        Ok(())
    }

    /// Queues the given guild for a full re-fetch of all members. Returns
    /// the total number of requests currently queued.
    pub fn queue_guild_members_fetch(&self, shard: u64, id: Id<GuildMarker>) -> usize {
        // Queue this guild for a full member fetch.
        let _ = self.guild_member_tx.send((shard, id));

        self.outstanding_count
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst)
    }

    /// Invoked on a new task whenever a guild is "created", either through startup Ready,
    /// through startup guild creation, or whenever the bot joins a new server. Ensures that
    /// we fetch the full list of members.
    async fn handle_guild_created(self: Arc<Worker>, guild: &Guild, shard: u64) -> VoidResult {
        let has_all_members =
            guild.members.len() >= guild.member_count.map(|x| x as usize).unwrap_or(usize::MAX);

        debug!(
            "[{shard}] Joined guild {} with {} members.",
            guild.name,
            guild.members.len()
        );

        // Update cache. This can take a while, so we'll do it in a separate task.
        let upsert_guild = guild.clone();
        let upsert_self = self.clone();
        tokio::spawn(async move {
            let _ = upsert_self.cache.upsert_guild(upsert_guild).await;
        });

        // If we already have all members, no need
        if has_all_members {
            debug!(
                "Received full set of members ({}) in initial guild creation for {} ({})",
                guild.members.len(),
                guild.name,
                guild.id.get()
            );

            self.db.reset_guild(guild.id).await?;
            self.db
                .upsert_batch_members(guild.id, guild.members.iter())
                .await?;

            return Ok(());
        }

        // Queue this guild for a full member fetch.
        let new_count = self.queue_guild_members_fetch(shard, guild.id);

        debug!(
            "Received {}/{} members in initial guild creation for {}. Now have {} member queries queued. ({})",
            guild.members.len(),
            guild.member_count.map(|x| x as i64).unwrap_or(-1),
            guild.name,
            new_count,
            guild.id.get()
        );

        Ok(())
    }

    /// Invoked whenever some member chunk arrives. Note that we implicitly assume
    /// that all requests beforehand have deleted the old guild information so that
    /// we do not keep stale members in there that have already left.
    async fn handle_member_chunk(self: Arc<Worker>, chunk: &MemberChunk) -> VoidResult {
        debug!(
            "Received {}-long member chunk for {}",
            chunk.members.len(),
            chunk.guild_id.get()
        );

        // if this is the last chunk, clear it from the outstanding member requests
        if chunk.chunk_index == chunk.chunk_count - 1 {
            self.outstanding_member_requests.remove(&chunk.guild_id);

            debug!(
                "Received all members for {}. Now have {} outstanding member requests that are still pending.",
                chunk.guild_id.get(),
                self.outstanding_member_requests.len()
            );
        }

        self.db
            .upsert_batch_members(chunk.guild_id, chunk.members.iter())
            .await?;

        Ok(())
    }

    /// Invoked on a new task whenever a guild is deleted. We clean up both the cache
    /// and the membership for the guild.
    async fn handle_guild_deleted(self: Arc<Worker>, guild_id: Id<GuildMarker>) -> VoidResult {
        debug!("Got kicked from guild {}", guild_id.get());

        self.cache.delete_guild(guild_id).await?;
        self.db.reset_guild(guild_id).await?;

        Ok(())
    }

    /// Infinite loop that changes the presence of the bot between a set
    /// of preconfigured presences.
    async fn presence_loop(self: Arc<Worker>) {
        for &status in STATUSES.iter().cycle() {
            // Wait for 10 minutes. We do this before setting a presence as we also set an initial
            // presence when we connect to the gateway. This also works around a quirk in Twilight
            // where we sometimes cannot send commands to shards right after connecting to them.
            tokio::time::sleep(tokio::time::Duration::from_secs(600)).await;

            let message =
                UpdatePresence::new(vec![status.to_activity()], false, None, Status::Online)
                    .unwrap();

            for shard in &self.shard_senders {
                match shard.command(&message) {
                    Err(x) => warn!("Error setting presence: {:?}", x),
                    _ => {}
                }
            }
        }
    }

    /// Infinite loop that handles messages received in the given queue and
    /// emits member requests to Discord for each message in the queue.
    async fn member_request_loop(
        self: Arc<Worker>,
        mut rx: mpsc::UnboundedReceiver<(u64, Id<GuildMarker>)>,
    ) {
        let mut interval = tokio::time::interval(Duration::from_millis(50));
        interval.set_missed_tick_behavior(MissedTickBehavior::Delay);

        while let Some((shard, guild)) = rx.recv().await {
            interval.tick().await;

            let cmd = RequestGuildMembers::builder(guild)
                .presences(false)
                .query("", None);

            // Queue the request. Twilight doesn't really allow us to query the state of the
            // request after queuing it, so this is the best we can do. Let's hope that twilight
            // does not lose it somewhere along the way.
            let send_was_successful = self.shard_senders[shard as usize]
                .command(&cmd)
                .map(|_| ())
                .is_ok();

            if !send_was_successful {
                warn!(
                    "Error requesting guild members for {} in shard {}, retrying later",
                    guild, shard
                );

                let _ = self.guild_member_tx.send((shard, guild));
                continue;
            }

            let new_count = self
                .outstanding_count
                .fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
            debug!(
                "Sent member request for {}, now have {} outstanding",
                guild, new_count
            );

            // Clear the guild info now. We will get the full list of members now that
            // we have requested it from the gateway.
            let _ = self.db.reset_guild(guild).await;

            // Register that we're waiting for this.
            self.outstanding_member_requests
                .insert(guild, Instant::now());
        }
    }
}

trait ToActivity {
    fn to_activity(&self) -> Activity;
}

impl ToActivity for (ActivityType, &'static str) {
    fn to_activity(&self) -> Activity {
        let (ty, msg) = self;

        let message = format!(
            "{} \n{}Version {}",
            msg,
            "\u{3000}".repeat(118 - msg.len() - VERSION.len()),
            VERSION
        );

        MinimalActivity {
            kind: *ty,
            name: message,
            url: None,
        }
        .into()
    }
}
