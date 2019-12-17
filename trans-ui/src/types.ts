/**
 * Represents a field in an embed.
 */
export interface Field<T> {
    name: T;
    value: T;
    inline?: boolean;
}

/**
 * Represents an embed.
 */
export interface EmbedObject<T> {
    title?: T;
    color: number;
    timestamp?: string;
    description?: T;
    fields?: Field<T>[];
    author?: {
        name: T;
        icon_url?: string;
    };
    footer?: {
        text?: T;
        icon_url?: string;
    };
    thumbnail?: {
        url: string;
    };
    image?: {
        url: string;
        width: number;
        height: number;
    };
}

/**
 * Represents a pre-localized string that is used to build a localized embed
 * for demonstration purposes.
 */
export type LocalizedString = (
    string | { name: string, args: null | { [key: string]: string | number | LocalizedString } } | { champion: string }
)[];

/**
 * Represents a section of translation that is automatically rendered.
 */
export interface TranslationSectionDefinition {
    title: string;
    description: string;
    keyGroups: {
        keys: string[],
        embed?: number
    }[];
    embeds: (LocalizedEmbedObject & { header: string })[];
}

export type DiscordField = Field<string>;
export type DiscordEmbedObject = EmbedObject<string>;

export type LocalizedField = Field<LocalizedString>;
export type LocalizedEmbedObject = EmbedObject<LocalizedString>;