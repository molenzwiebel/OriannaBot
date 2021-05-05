import * as amqp from "amqplib";
import { EventEmitter } from "events";
import config from "../config";
import debug = require("debug");

const log = debug("orianna:dissonance:amqp");

export default class AMQPClient extends EventEmitter {
    private connection: amqp.Connection;
    private channel: amqp.Channel;

    public async connect(): Promise<void> {
        this.connection = await amqp.connect(config.dissonance.amqpHost);
        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(config.dissonance.exchange, "topic", { durable: false });
        await this.channel.assertQueue(config.dissonance.queue, { durable: false });

        await this.channel.bindQueue(config.dissonance.queue, config.dissonance.exchange, "");

        await this.channel.consume(config.dissonance.queue, msg => {
            if (!msg) return;

            try {
                const ev = JSON.parse(msg.content.toString("utf8"));
                this.handleMessage(ev);
            } catch {
                // Ignored, should never happen.
            }
        }, { noAck: true });
    }

    public on(event: "messageCreate", handler: (msg: dissonance.Message) => any): this;
    public on(event: "messageUpdate", handler: (msg: dissonance.Message) => any): this;
    public on(event: "messageDelete", handler: (msg: dissonance.MessageDeleteEvent) => any): this;
    public on(event: "messageReactionAdd", handler: (msg: dissonance.ReactionAddEvent) => any): this;
    public on(event: "interactionCreate", handler: (msg: dissonance.InteractionCreateEvent) => any): this;

    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Handles a message received by the AMQP events channel, which should be
     * an event as emitted through Dissonance by the Discord gateway.
     */
    private handleMessage(message: dissonance.GatewayEvent) {
        if (message.t === "MESSAGE_CREATE") {
            this.emit("messageCreate", message.d);
        } else if (message.t === "MESSAGE_UPDATE") {
            this.emit("messageUpdate", message.d);
        } else if (message.t === "MESSAGE_DELETE") {
            this.emit("messageDelete", message.d);
        } else if (message.t === "MESSAGE_REACTION_ADD") {
            this.emit("messageReactionAdd", message.d);
        } else if (message.t === "INTERACTION_CREATE") {
            this.emit("interactionCreate", message.d);
        } else {
            log("Unknown gateway event received: %O", message as any);
        }
    }
}