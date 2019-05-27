import * as cluster from "cluster";
import DiscordClient from "../discord/client";
import { Role, User } from "../database";
import IPCBase, { IPCRequest } from "./ipc-base";

/**
 * Class that handles all IPC messaging on the master process.
 */
class MasterIPC extends IPCBase {
    constructor(private client: DiscordClient, worker: cluster.Worker) {
        super(worker);
    }

    /**
     * Updates the specified user. Returns whether or not the update was successful.
     */
    public fetchAndUpdateUser(user: User | string): Promise<boolean> {
        return this.sendRequest({
            action: "fetch-update",
            args: typeof user !== "string" ? user.snowflake : user
        });
    }

    protected async handleRequest(msg: IPCRequest) {
        if (msg.action === "search-user") {
            // Return response in the format of [[snowflake, roles], [snowflake, roles]]
            return this.client.bot.guilds.filter(x => x.members.has(msg.args)).map(x => [x.id, x.members.get(msg.args)!.roles]);
        } else if (msg.action === "add-role") {
            // Run it directly, ignoring any errors.
            return this.client.bot.addGuildMemberRole.apply(this.client.bot, msg.args).then(() => true, () => false);
        } else if (msg.action === "remove-role") {
            // Run it directly, ignoring any errors.
            return this.client.bot.removeGuildMemberRole.apply(this.client.bot, msg.args).then(() => true, () => false);
        } else if (msg.action === "notify") {
            this.client.notify(msg.args[0], msg.args[1]).catch(() => { /* Ignored */ });
        } else if (msg.action === "announce-promotion") {
            const user = await User.query().where("id", msg.args[0]).first();
            const role = await Role.query().where("id", msg.args[1]).first().eager("[conditions]");
            if (!user || !role) return;

            this.client.announcePromotion(user, role, msg.args[2]).catch(e => { /* Ignored */ });
        } else {
            throw new Error("IPC operation not supported by master: " + msg.action);
        }
    }
}

let ipcInstances: MasterIPC[] = [];

/**
 * Sends a request for the specified user to be updated to the first worker available.
 * Returns a boolean indicating whether or not the refresh was successful.
 */
export function fetchAndUpdateUser(user: User | string): Promise<boolean> {
    return ipcInstances[0].fetchAndUpdateUser(user);
}

/**
 * Forks the current process for one or more updater processes, then sets up message
 * handlers so that they can talk to the current master process.
 *
 * Note: right now only a single child is supported, due to the way that updaters select
 * which user to update next. A queue such as redis should be used instead.
 */
export function initializeMasterRPC(client: DiscordClient, numChildren = 1) {
    if (ipcInstances.length) throw new Error("Cluster already initialized.");
    if (!cluster.isMaster) throw new Error("Cluster needs to be master.");
    if (numChildren !== 1) throw new Error("Can only have a single child right now.");

    ipcInstances = Array(numChildren).fill(1).map(() => {
        return new MasterIPC(client, cluster.fork());
    });
}