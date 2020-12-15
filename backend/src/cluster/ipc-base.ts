import { ResponseOptions } from "../discord/response";

/**
 * Represents a request sent by a worker to this process, or from this process to a worker.
 */
export type IPCRequest = { isRequest: true } & ({
    id: number;
    action: "search-user"; // find the guilds a user is on, and which roles they have
    args: string; // snowflake
} | {
    id: number;
    action: "add-role"; // add the role to the specified user on the specified guild
    args: string[]; // [guild id, user id, role id, reason]
} | {
    id: number;
    action: "remove-role"; // remove the role from the specified user on the specified guild
    args: string[]; // [guild id, user id, role id, reason]
} | {
    action: "notify"; // notify the specified user with the specified message, if they have dms enabled
    args: [string, ResponseOptions]; // [snowflake, body]
} | {
    action: "announce-promotion"; // announce a promotion for the specified user to the specified role
    args: [number, number, string]; // [user id, role id, snowflake]
} | {
    id: number;
    action: "fetch-update"; // trigger an update for the specified user
    args: string; // snowflake
} | {
    action: "set-nickname"; // set the nickname of the specified user on the specified guild to the specified text, unless it already is that nick
    args: string[]; // [guild id, user id, nickname]
});

/**
 * Represents a response sent back from the master to the worker process.
 * Note that not all requests may receive a response, only those with the ID property.
 */
export type IPCResponse = {
    isRequest: false;
    id: number;
    result: any;
};

/**
 * Represents a message that can be sent over the IPC channel.
 */
export type IPCMessage = IPCRequest | IPCResponse;

/**
 * Base class that handles IPC messages between the master process and the update worker(s).
 */
export default abstract class IPCBase {
    private counter = 0;
    private callbacks = new Map<number, Function>();
    private tunnel: any;

    constructor(tunnel: any) {
        this.setWorker(tunnel);
    }

    /**
     * Sets or updates the current worker. Invoked on process start and when the worker
     * process dies.
     */
    protected setWorker(tunnel: any) {
        this.tunnel = tunnel;

        tunnel.on("message", async (msg: IPCMessage) => {
            // If this is a request, have the subclass handle it.
            if (msg.isRequest) {
                const response = await this.handleRequest(msg);
                if (typeof (<any>msg).id !== "undefined") {
                    this.tunnel.send({
                        isRequest: false,
                        id: (<any>msg).id,
                        result: response
                    });
                }

                return;
            }

            // Else, this is a response. Find the correct promise and resolve it.
            if (!this.callbacks.has(msg.id)) return;

            const cb = this.callbacks.get(msg.id)!;
            this.callbacks.delete(msg.id);

            cb(msg.result);
        });
    }

    /**
     * Handles a request sent to this process. The return value is sent back as
     * a response, unless the message does not have an ID property.
     */
    protected abstract handleRequest(msg: IPCRequest): Promise<any>;

    /**
     * Sends the specified raw request to the other process, then returns a promise that
     * resolves when the method has been resolved.
     */
    protected sendRequest<T>(request: Partial<IPCRequest>): Promise<T> {
        const id = this.counter++;
        this.tunnel.send({
            id,
            isRequest: true,
            ...request
        });

        return new Promise(resolve => {
            this.callbacks.set(id, resolve);
        });
    }

    /**
     * Similar to sendRequest, but doesn't bother waiting for a response.
     */
    protected send(request: Partial<IPCRequest>) {
        this.tunnel.send({
            isRequest: true,
            ...request
        });
    }
}