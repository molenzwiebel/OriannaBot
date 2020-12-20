
export const enum ApplicationCommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8
}

export interface SlashCommandDescription {
    name: string;
    description: string;
    options: ApplicationCommandOption[];
}

export interface ApplicationCommandOption {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    default?: boolean;
    required?: boolean;
    choices?: ApplicationCommandOptionChoice[];
    options?: ApplicationCommandOption[];
}

export interface ApplicationCommandOptionChoice {
    name: string;
    value: string;
}

export interface SlashCommandInvocationArgumentData {
    name: string;
    value?: any;
    options?: SlashCommandInvocationArgumentData[];
}

export interface SlashCommandInvocationData {
    token: string;
    data: SlashCommandInvocationArgumentData;
    member: {
        user: {
            username: string;
            id: string;
        };
    };
    channel_id: string;
    guild_id: string;
    id: string;
}

export function commandInvocationParamsToName(inv: SlashCommandInvocationArgumentData): string {
    if (inv.value) return "";
    if (!inv.options) return inv.name;
    if (inv.options.length > 1) return inv.name;
    if (inv.options[0].value) return inv.name;
    return inv.name + "." + commandInvocationParamsToName(inv.options![0]);
}

export function commandInvocationFindParams(inv: SlashCommandInvocationArgumentData): { name: string, value: any }[] {
    if (!inv.options) return [];
    if (inv.options && inv.options.some(x => x.value)) return inv.options as any;

    return commandInvocationFindParams(inv.options[0]);
}

export function applicationCommandToNames(command: ApplicationCommandOption): string[] {
    if (command.type === ApplicationCommandOptionType.SUB_COMMAND) return [command.name];
    if (command.type === ApplicationCommandOptionType.SUB_COMMAND_GROUP) return command.options!.map(x => command.name + "." + x.name);

    throw new Error("Illegal command type: " + command.type);
}