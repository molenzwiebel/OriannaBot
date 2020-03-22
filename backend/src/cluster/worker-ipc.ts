import * as cluster from "cluster";
import { ResponseOptions } from "../discord/response";
import { Role, User } from "../database";
import IPCBase, { IPCRequest } from "./ipc-base";
import Updater from "../discord/updater";

/**
 * Class that handles all IPC messaging on the worker processes.
 */
export class WorkerIPC extends IPCBase {
    constructor(private updater: Updater) {
        super(process);
    }

    /**
     * Finds all guilds that the specified user is on. Note that this depends on our local
     * cache and thus may not _always_ be 100% correct.
     */
    public searchUser(snowflake: string): Promise<{
        guild: string,
        nick: string | null,
        roles: string[]
    }[]> {
        return this.sendRequest({
            action: "search-user",
            args: snowflake
        });
    }

    /**
     * Proxy for the eris method to assign the specified role to the specified user. Returns
     * whether or not the action was successful.
     */
    public addGuildMemberRole(guildId: string, userId: string, roleId: string, reason?: string): Promise<boolean> {
        return this.sendRequest({
            action: "add-role",
            args: [guildId, userId, roleId, ...(reason ? [reason] : [])]
        });
    }

    /**
     * Proxy for the eris method to remove the specified role to the specified user. Returns
     * whether or not the action was successful.
     */
    public removeGuildMemberRole(guildId: string, userId: string, roleId: string, reason?: string): Promise<boolean> {
        return this.sendRequest({
            action: "remove-role",
            args: [guildId, userId, roleId, ...(reason ? [reason] : [])]
        });
    }

    /**
     * Proxy for DiscordClient.notify.
     */
    public notify(snowflake: string, options: ResponseOptions) {
        this.send({
            action: "notify",
            args: [snowflake, options]
        });
    }

    /**
     * Announces a promotion for the specified user and the specified role on the specified server.
     */
    public announcePromotion(user: User, role: Role, guildId: string) {
        this.send({
            action: "announce-promotion",
            args: [user.id, role.id, guildId]
        });
    }

    /**
     * Changes the nickname of `user` on `guildId` to `nickname`. If nickname is empty, removes it.
     */
    public setNickname(guildId: string, user: User, nickname: string) {
        this.send({
            action: "set-nickname",
            args: [guildId, user.snowflake, nickname]
        });
    }

    /**
     * Handles an operation for this worker.
     */
    protected async handleRequest(msg: IPCRequest): Promise<any> {
        if (msg.action !== "fetch-update") throw new Error("Unsupported operation for worker IPC");

        return this.updater.fetchAndUpdateAll(msg.args).then(() => true, () => false);
    }
}

/**
 * Creates a new IPC channel for the specified updater.
 */
export default function createIPC(updater: Updater) {
    if (!cluster.isWorker) throw new Error("WorkerIPC can only be created in a worker process.");

    return new WorkerIPC(updater);
}