import { ApplicationCommandOptionType } from "discord-api-types/v10";

export function commandInvocationParamsToName(inv: any): string {
    if (inv.value) return "";
    if (!inv.options || !inv.options.length) return inv.name;
    if (inv.options.length > 1) return inv.name;
    if (inv.options[0].value) return inv.name;
    return inv.name + "." + commandInvocationParamsToName(inv.options![0]);
}

export function commandInvocationFindParams(inv: any): { name: string, value: any }[] {
    if (!inv.options || !inv.options.length) return [];
    if (inv.options.some((x: any) => x.value)) return inv.options as any;

    return commandInvocationFindParams(inv.options[0]);
}

export function applicationCommandToNames(command: any): string[] {
    if (command.type === ApplicationCommandOptionType.Subcommand) return [command.name];
    if (command.type === ApplicationCommandOptionType.SubcommandGroup) return command.options!.map((x: any) => command.name + "." + x.name);

    throw new Error("Illegal command type: " + command.type);
}