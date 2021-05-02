import ApplicationCommandInteractionDataOption = dissonance.ApplicationCommandInteractionDataOption;
import ApplicationCommandOptionType = dissonance.ApplicationCommandOptionType;

export function commandInvocationParamsToName(inv: ApplicationCommandInteractionDataOption): string {
    if (inv.value) return "";
    if (!inv.options) return inv.name;
    if (inv.options.length > 1) return inv.name;
    if (inv.options[0].value) return inv.name;
    return inv.name + "." + commandInvocationParamsToName(inv.options![0]);
}

export function commandInvocationFindParams(inv: ApplicationCommandInteractionDataOption): { name: string, value: any }[] {
    if (!inv.options) return [];
    if (inv.options && inv.options.some(x => x.value)) return inv.options as any;

    return commandInvocationFindParams(inv.options[0]);
}

export function applicationCommandToNames(command: ApplicationCommandInteractionDataOption): string[] {
    if (command.type === ApplicationCommandOptionType.SUB_COMMAND) return [command.name];
    if (command.type === ApplicationCommandOptionType.SUB_COMMAND_GROUP) return command.options!.map(x => command.name + "." + x.name);

    throw new Error("Illegal command type: " + command.type);
}