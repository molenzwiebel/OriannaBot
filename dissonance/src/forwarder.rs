use std::{collections::HashSet, error::Error};

use lapin::{
    options::{BasicPublishOptions, ExchangeDeclareOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
    BasicProperties, Channel, ExchangeKind,
};
use twilight_model::gateway::event::{shard::Payload, GatewayEventDeserializer};

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
    pub async fn try_forward(self: &Forwarder, payload: Payload) -> ForwarderResult<()> {
        let bytes = payload.bytes;

        // Needs to be a scope since we want to clone `ty` but keep ownership of the rest.
        let ty = {
            // this has already been parsed by twilight and should be safe
            let json_as_str = unsafe { std::str::from_utf8_unchecked(&bytes) };

            let parsed = match GatewayEventDeserializer::from_json(json_as_str) {
                Some(ev) => ev,
                None => return Ok(()),
            };

            match parsed.event_type_ref() {
                Some(ty) => ty.to_string(),
                None => return Ok(()),
            }
        };

        if FORWARD_EVENTS.contains(&ty[..]) {
            self.0
                .basic_publish(
                    "dissonance",
                    &ty,
                    BasicPublishOptions::default(),
                    bytes,
                    BasicProperties::default(),
                )
                .await?;
        }

        Ok(())
    }
}
