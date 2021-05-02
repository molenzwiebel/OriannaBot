/**
 * Most of these types are incomplete and follow directly from the data
 * emitted by the Discord gateway.
 */
namespace dissonance {
    export interface Message {
        author: User;
        channel_id: string;
        content: string;
        edited_timestamp?: string | null;
        guild_id?: string | null;
        id: string;
        member?: PartialMember | null;
        mentions: Mention[];
        pinned: boolean;
        referenced_message?: Message | null;
        timestamp: string;
        tts: boolean;
        webhook_id?: string;
    }

    export interface User {
        avatar?: string | null;
        bot: boolean;
        discriminator: string;
        id: string;
        name: string;
    }

    export interface PartialMember {
        deaf: boolean;
        joined_at: string | null;
        mute: boolean;
        nick: string | null;
        premium_since: string | null;
        roles: string[];
    }

    export interface Mention {
        avatar?: string | null;
        bot: boolean;
        discriminator: string;
        id: string;
        member?: PartialMember | null;
        name: string;
    }

    export interface Guild {
        afk_channel_id?: string | null;
        afk_timeout: number;
        approximate_member_count?: number | null;
        approximate_presence_count?: number | null;
        banner?: string | null;
        channels: GuildChannel[];
        emojis: Emoji[];
        features: string[];
        icon?: string | null;
        id: string;
        joined_at?: string | null;
        large: boolean;
        lazy?: boolean | null;
        max_members?: number | null;
        max_presences?: number | null;
        max_video_channel_users?: number | null;
        member_count?: number | null;
        members: never[];
        name: string;
        nsfw: boolean;
        owner_id: string;
        owner?: boolean | null;
        permissions?: number | null;
        preferred_locale: string;
        premium_subscription_count?: number | null;
        presences: never[];
        region: string;
        roles: Role[];
        rules_channel_id?: string | null;
        splash?: string | null;
        system_channel_id?: string | null;
        unavailable: boolean;
        vanity_url_code?: string | null;
        voice_states: never[];
        widget_channel_id?: string | null;
        widget_enabled?: boolean | null;
    }

    export interface Role {
        color: number;
        hoist: boolean;
        id: string;
        managed: boolean;
        mentionable: boolean;
        name: string;
        permissions: number;
        position: number;
    }

    export interface Emoji {
        animated: boolean;
        available: boolean;
        id: string;
        managed: boolean;
        name: string;
    }

    export type GuildChannel = CategoryChannel | TextChannel | VoiceChannel;

    export interface CategoryChannel {
        guild_id: string | null;
        id: string;
        type: ChannelType.GUILD_CATEGORY;
        name: string;
        position: number;
    }

    export interface TextChannel {
        guild_id: string | null;
        id: string;
        type: ChannelType.GUILD_TEXT;
        name: string;
        nsfw: boolean;
        parent_id: string | null;
        position: number;
        topic: string | null;
    }

    export interface VoiceChannel {
        guild_id: string | null;
        id: string;
        type: ChannelType.GUILD_VOICE;
        name: String;
        parent_id: string | null;
        position: number;
    }

    export const enum ChannelType {
        GUILD_TEXT = 0,
        PRIVATE = 1,
        GUILD_VOICE = 2,
        GROUP = 3,
        GUILD_CATEGORY = 4,
        GUILD_NEWS = 5,
        GUILD_STORE = 6,
        GUILD_STAGE_VOICE = 13,
    }

    export interface MessageDeleteEvent {
        channel_id: string;
        guild_id?: string | null;
        id: string;
    }

    export interface MessageUpdateEvent {
        author?: User | null;
        channel_id: string;
        content?: string | null;
        edited_timestamp?: string | null;
        guild_id?: string | null;
        id: string;
        mentions?: User[] | null;
        timestamp?: string | null;
    }

    export interface ReactionAddEvent {
        channel_id: string;
        emoji: ReactionEmoji;
        guild_id?: string | null;
        member?: PartialMember | null;
        message_id: string;
        user_id: string;
    }

    export interface InteractionCreateEvent {
        id: string;
        application_id: string;
        type: InteractionType;
        data?: ApplicationCommandInteractionData;
        guild_id?: string;
        channel_id?: string;
        member?: PartialMember;
        user?: User;
        token: string;
    }

    export interface ApplicationCommandInteractionData {
        id: string;
        name: string;
        options: ApplicationCommandInteractionDataOption[];
    }

    export interface ApplicationCommandInteractionDataOption {
        name: string;
        type: ApplicationCommandOptionType;
        value?: any;
        options?: ApplicationCommandInteractionDataOption[];
    }

    export const enum ApplicationCommandOptionType {
        SUB_COMMAND = 1,
        SUB_COMMAND_GROUP = 2,
        STRING = 3,
        INTEGER = 4,
        BOOLEAN = 5,
        USER = 6,
        CHANNEL = 7,
        ROLE = 8,
        MENTIONABLE = 9
    }

    export const enum InteractionType {
        PING = 1,
        COMMAND = 2
    }

    export type ReactionEmoji =
        | {
        animated: boolean;
        id: string;
        name?: string;
    }
        | { name: string };

    export type GatewayEvent =
        | {
        t: "MESSAGE_CREATE";
        d: Message;
    }
        | {
        t: "MESSAGE_DELETE";
        d: MessageDeleteEvent;
    }
        | {
        t: "MESSAGE_UPDATE";
        d: MessageUpdateEvent;
    }
        | {
        t: "MESSAGE_REACTION_ADD";
        d: ReactionAddEvent;
    }
        | {
        t: "INTERACTION_CREATE";
        d: InteractionCreateEvent;
    };
}
