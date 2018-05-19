/**
 * Incomplete declarations for elastic-apm-node.
 */
declare module "elastic-apm-node" {
    class Transaction {
        result: number;
        end(): void;
    }

    class APMClient {
        startTransaction(name: string, type: string): Transaction;
        captureError(err: any, opts?: any): void;
        setCustomContext(ctx: any): void;
    }

    export function start(options: {
        serviceName: string,
        serverUrl?: string,
        logLevel?: string
    }): APMClient;
}