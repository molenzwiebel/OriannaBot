declare module "git-last-commit" {
    export interface Commit {
        shortHash: string;
        hash: string;
        subject: string;
        sanitizedSubject: string;
        body: string;
        authoredOn: string;
        committedOn: string;
        author: {
            name: string;
            email: string;
        };
        committer: {
            name: string;
            email: string;
        };
        notes: string;
        branch: string;
        tags: string[];
    }

    export function getLastCommit(cb: (err: Error | undefined, result: Commit) => any, options?: {
        dst?: string,
        splitChar?: string
    }): void;
}