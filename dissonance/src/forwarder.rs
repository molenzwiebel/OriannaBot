use std::{collections::HashSet, error::Error, num::NonZeroU64};

use lapin::{
    options::{BasicPublishOptions, ExchangeDeclareOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
    BasicProperties, Channel, ExchangeKind,
};
use twilight_model::gateway::event::GatewayEventDeserializer;

use crate::worker::Worker;

/// Simple Result alias that returns any error.
type ForwarderResult<T> = Result<T, Box<dyn Error>>;

lazy_static! {
    static ref FORWARD_EVENTS: HashSet<&'static str> = {
        let mut set = HashSet::new();

        set.insert("GUILD_MEMBER_ADD");
        set.insert("MESSAGE_CREATE");
        set.insert("MESSAGE_UPDATE");
        set.insert("MESSAGE_DELETE");
        set.insert("MESSAGE_REACTION_ADD");
        set.insert("INTERACTION_CREATE");

        set
    };
}

const EXCHANGE: &str = "dissonance";
const TOPIC: &str = "dissonance.events";

const MAGIC_REFRESH_INCANTATION: &str = "magic_incantation_for_refreshing_guild_members_";

pub(crate) struct Forwarder(Channel);

impl Forwarder {
    /// Sets up a RabbitMQ exchange and channel and prepares this
    /// forwarder to send messages. The RabbitMQ server should be
    /// defined in the AMQP_URL environment variable.
    pub async fn connect() -> ForwarderResult<Forwarder> {
        let amqp = lapin::Connection::connect(
            format!("amqp://{}/%2f", std::env::var("AMQP_URL")?).as_str(),
            lapin::ConnectionProperties::default(),
        )
        .await?;

        let send_channel = amqp.create_channel().await?;

        send_channel
            .exchange_declare(
                EXCHANGE,
                ExchangeKind::Topic,
                ExchangeDeclareOptions {
                    passive: false,
                    durable: false,
                    auto_delete: false,
                    internal: false,
                    nowait: false,
                },
                FieldTable::default(),
            )
            .await?;

        send_channel
            .queue_declare(
                TOPIC,
                QueueDeclareOptions {
                    passive: false,
                    durable: false,
                    exclusive: false,
                    auto_delete: false,
                    nowait: false,
                },
                FieldTable::default(),
            )
            .await?;

        send_channel
            .queue_bind(
                TOPIC,
                EXCHANGE,
                "#",
                QueueBindOptions::default(),
                FieldTable::default(),
            )
            .await?;

        Ok(Forwarder(send_channel))
    }

    /// Attempts to parse the given raw bytes received from Discord as
    /// a gateway event and forwards it through ZeroMQ if it exists in a
    /// list of events we'd like to forward.
    pub async fn try_forward(
        self: &Forwarder,
        worker: &Worker,
        shard_id: u64,
        payload: &str,
    ) -> ForwarderResult<()> {
        // Needs to be a scope since we want to clone `ty` but keep ownership of the rest.
        let ty = {
            // this has already been parsed by twilight and should be safe
            let parsed = match GatewayEventDeserializer::from_json(payload) {
                Some(ev) => ev,
                None => return Ok(()),
            };

            match parsed.event_type() {
                Some(ty) => {
                    let _ = self.introspect_packet(worker, shard_id, ty, payload).await;
                    ty.to_string()
                }
                None => return Ok(()),
            }
        };

        if FORWARD_EVENTS.contains(&ty[..]) {
            self.0
                .basic_publish(
                    "dissonance",
                    &ty,
                    BasicPublishOptions::default(),
                    payload.as_bytes(),
                    BasicProperties::default(),
                )
                .await?;
        }

        Ok(())
    }

    /// Utility function that allows us to introspect an unparsed blob to
    /// do some magic functions when encountering magic incantations in the
    /// blob. This is quite a hack, but allows us to forego the performance
    /// penalty of parsing every message.
    async fn introspect_packet(
        self: &Forwarder,
        worker: &Worker,
        shard_id: u64,
        ty: &str,
        contents: &str,
    ) -> ForwarderResult<()> {
        match ty {
            "MESSAGE_CREATE" => {
                let magic_incantation_idx = contents.find(MAGIC_REFRESH_INCANTATION);

                if let Some(idx) = magic_incantation_idx {
                    let guild_id: NonZeroU64 = contents[idx + MAGIC_REFRESH_INCANTATION.len()..]
                        .chars()
                        .take_while(|x| x.is_ascii_digit())
                        .collect::<String>()
                        .parse()?;

                    worker.queue_guild_members_fetch(shard_id, guild_id.into());
                }
            }
            _ => {}
        }

        Ok(())
    }
}
