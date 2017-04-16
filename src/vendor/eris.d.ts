declare module eris {
    class Guild {
        id: string;
        name: string;
        ownerID: string;
        defaultChannel: GuildChannel;
        roles: Collection<string, Role>;
        members: Collection<string, Member>;
        getInvites(): Promise<Invite[]>;
    }

    class Invite {
        code: string;
    }

    class GuildChannel extends Channel {
        name: string;
        id: string;
    }

    class Collection<K, V> extends Map<K, V> {
        map<T>(fn: (v: V) => T): T[];
        filter(fn: (v: V) => boolean): V[];
        find(fn: (v: V) => boolean): V | undefined;
    }

    class Role {
        id: string;
        name: string;
        position: number;
        hoist: boolean;
        color: number;
        mentionable: boolean;
        permissions: { allow: number, deny: number };
    }

    class Channel {
        id: string;
        guild: Guild;
        recipient?: User; // only present in DM channels
        createMessage(content: string | { embed: Embed }): Promise<Message>;
        editMessage(msgId: string, content: string | { embed: Embed }): Promise<Message>;
    }

    class PrivateChannel extends Channel {
        createMessage(content: string | { embed: Embed }): Promise<Message>;
    }

    class Message {
        id: string;
        author: User;
        channel: Channel;
        member: Member;
        content: string;
        guild: Guild;
        mentions: User[];
        embeds: Embed[];
        cleanContent: string;
        edit(content: string | { embed: Embed }): Promise<Message>;
        addReaction(reaction: string, user: string): Promise<void>;
        getReaction(reaction: string, limit?: number): Promise<User[]>;
        removeReaction(reaction: string, user: string): Promise<void>;
        delete(): Promise<void>;
    }

    class User {
        id: string;
        bot: boolean;
        username: string;
        avatarURL: string;
    }

    class Member {
        id: string;
        status: "online" | "idle" | "offline";
        username: string;
        user: User;
        nick?: string;
        bot: boolean;
        guild: Guild;
        roles: string[];
    }

    interface Embed {
        title?: string;
        description?: string;
        url?: string;
        timestamp?: Date;
        color?: number;
        footer?: { text?: string, icon_url?: string, proxy_icon_url?: string };
        image?: { url?: string, height?: number, width?: number };
        thumbnail?: { url?: string, height?: number, width?: number };
        author?: { name?: string, url?: string, icon_url?: string };
        fields?: { name?: string, value?: string, inline?: boolean }[];
        provider?: { name?: string, url?: string };
    }

    class Eris {
        constructor(key: string);

        guilds: Collection<string, Guild>;
        user: User;

        connect(): Promise<void>;
        editStatus(status: "online" | "idle" | "dnd" | "invisible", game?: { name: string, type?: number, url?: string }): void;
        createMessage(channelId: string, content: string | { embed: Embed }, file?: { file: Buffer, name: string }): Promise<Message>;
        editMessage(channelId: string, messageId: string, content: string | { embed: Embed }): Promise<void>;
        getDMChannel(userId: string): Promise<PrivateChannel>;
        removeGuildMemberRole(guildId: string, memberId: string, roleId: string): Promise<void>;
        addGuildMemberRole(guildId: string, memberId: string, roleId: string): Promise<void>;
        createRole(guildId: string, opts: { name: string, permissions?: number, color?: number, hoist?: boolean, mentionable?: boolean }): Promise<Role>;
        deleteRole(guildId: string, roleId: string): Promise<void>;
        getUserProfile(id: string): Promise<any>;

        on(event: "ready", handler: () => void): void;
        on(event: "guildCreate", handler: (g: Guild) => void): void;
        on(event: "guildDelete", handler: (g: Guild) => void): void;
        on(event: "guildUpdate", handler: (g: Guild, old: { name: string }) => void): void;
        on(event: "guildRoleUpdate", handler: (g: Guild, r: Role) => void): void;
        on(event: "guildMemberAdd", handler: (g: Guild, m: Member) => void): void;
        on(event: "userUpdate", handler: (u: User, old: { username: string }) => void): void;
        on(event: "messageCreate", handler: (m: Message) => void): void;
        on(event: "messageDelete", handler: (m: Message) => void): void;
        on(event: "messageReactionAdd", handler: (message: eris.Message, emoji: { id: string | null, name: string }, userID: string) => void): void;

        removeListener(event: string, handler: Function): void;
    }
}

declare module "eris" {
    export = eris.Eris;
}