import * as apm from "elastic-apm-node";
import * as es from "elasticsearch";
import * as eris from "eris";
import config from "./config";
import { randomBytes } from "crypto";

/**
 * Simple class that manages ElasticSearch logging and APM performance monitoring.
 */
class ElasticClient {
    private apm: apm.APMClient;
    private elastic: es.Client;
    private setupPromise: Promise<void>;

    constructor() {
        if (config.elastic.enabled) {
            (<any>global).apm = this.apm = apm.start({
                serviceName: "Orianna v2",
                serverUrl: config.elastic.host + ":8200",
                logLevel: 'trace'
            });

            this.elastic = new es.Client({
                host: config.elastic.host + ":9200",
                httpAuth: config.elastic.auth
            });

            this.setupPromise = this.setupMappings();
        }
    }

    /**
     * Starts a new APM transaction for the specified command.
     */
    startCommandTransaction(commandName: string): apm.Transaction | null {
        if (!config.elastic.enabled) return null;

        return this.apm.startTransaction(commandName, "command");
    }

    /**
     * Reports the specified object as an error. A custom ID will be generated for
     * the error and returned back, so it can be attached to the error message.
     */
    reportError(err: any, from: string): string | null {
        if (!config.elastic.enabled) return null;

        const errorId = randomBytes(16).toString("hex");
        this.apm.captureError(err, { custom: {
            incident: errorId,
            from,
            reportStack: new Error().stack
        } });
        return errorId;
    }

    /**
     * Reports the specified command and message to elasticsearch, if enabled.
     */
    async logCommand(cmd: string, msg: eris.Message) {
        if (!config.elastic.enabled) return;

        await this.setupPromise;

        // We don't care about whether this fails or not.
        this.elastic.index({
            index: "orianna_events",
            type: "orianna_events",
            body: {
                server: msg.channel instanceof eris.GuildChannel ? { name: msg.channel.guild.name, id: msg.channel.guild.id } : { name: "Private Message", id: "private_message" },
                author: { id: msg.author.id, name: msg.author.username },
                command: cmd,
                content: msg.content,
                cleanContent: msg.cleanContent,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Method to configure all mappings for the elasticsearch indexes. This is called upon
     * creation of the object.
     */
    private async setupMappings() {
        try {
            // This will throw if the index does not exist. Couldn't find a better way to do this, unfortunately.
            await this.elastic.indices.get({ index: "orianna_events" });
        } catch {
            // Index does not exist, create it.
            await this.elastic.indices.create({
                index: "orianna_events"
            });

            await this.elastic.indices.putMapping({
                index: "orianna_events",
                type: "orianna_events",
                body: {
                    properties: {
                        server: {
                            properties: {
                                id: { type: "keyword" },
                                name: { type: "keyword" }
                            }
                        },
                        author: {
                            properties: {
                                id: { type: "keyword" },
                                name: { type: "keyword" }
                            }
                        },
                        command: { type: "keyword" },
                        content: { type: "keyword" },
                        cleanContent: { type: "keyword" },
                        timestamp: { type: "date" }
                    }
                }
            });
        }
    }
}
const elastic = new ElasticClient();
export default elastic;