import { CommandContext } from "../command";
import { Server, User } from "../../database";
import config from "../../config";

/**
 * Utility method that takes a command context and either gets the current server or
 * sends an error to the user (if the command was used in a DM).
 */
export async function expectServer({ guild, error, server }: CommandContext): Promise<Server | undefined> {
    if (!guild) {
        await error({
            title: "🔍 What server?",
            description: "I'll need to know what server you are talking about. Try doing this again, but in a server instead of DMs."
        });
        return;
    }

    return server();
}

/**
 * Utility method that takes a command context and finds the user the message is
 * targeting. This looks for the first non-bot mention, or otherwise the sender
 * of the message.
 */
export async function expectUser({ msg, client, user }: CommandContext): Promise<User> {
    const mentionTarget = msg.mentions.find(x => !x.bot);
    return mentionTarget ? client.findOrCreateUser(mentionTarget.id) : user();
}

/**
 * Utility method that takes a command context and checks if the user invoking
 * the command has moderator permissions. If the user does, it returns true. If
 * the user does not, it will print a message and return false.
 */
export async function expectModerator({ msg, error, guild }: CommandContext): Promise<boolean> {
    // If this was sent in DMs, this is illegal and should really throw, but we will abort.
    if (!guild) return false;

    // Bot and server owner can obviously do anything.
    if (msg.author.id === config.discord.owner || msg.author.id === guild.ownerID) return true;

    // If the user can manage messages, they are considered a moderator.
    if (msg.member!.permission.has("manageMessages")) return true;

    await error({
        title: "✋ Stop Right There!",
        description: "You must be able to manage messages to use this feature. Sorry :("
    });
    return false;
}

// TODO(molenzwiebel): Implement this helper.
// /**
//  * Tries to find a champion name in the specified message. If a champion cannot be found,
//  * an attempt is made to use the configured champion in the current discord. Returns the champion
//  * id on success, or 0 on failure. An error reply will automatically be dispatched.
//  */
// export async function expectChampion(this: MessageHandler, msg: eris.Message): Promise<number> {
//     // Normalize champion names.
//     const names = Object.keys(this.client.championData).map(k => ({ champ: this.client.championData[+k], name: this.client.championData[+k].name.toLowerCase().replace(/\W/g, "") }));
//
//     // Normalize content.
//     const content = msg.content.toLowerCase().replace(/\W/g, "");
//
//     // If we have a direct match, return that.
//     const match = names.find(c => content.indexOf(c.name) !== -1);
//     if (match) return match.champ.id;
//
//     // Display a different error message if this was sent without a champion in DM.
//     // We do this here (even though there's also a check in expectServer) since the
//     // message sent in expectServer doesn't exactly show _why_ a server is needed.
//     const server = msg.channel.guild ? await DiscordServerModel.findBy({ snowflake: msg.channel.guild.id }) : null;
//     if (!server || !server.setupCompleted) {
//         await this.error(msg, {
//             title: ":question: Which champion?",
//             description: "I couldn't figure out which champion you were talking about, and you aren't sending this in a server where my setup is completed. Try specifying a champion name or running this in a server where I am configured."
//         });
//         return 0;
//     }
//
//     // Try to find a guild.
//     const guild = await this.expectServer(msg);
//     if (!guild) return 0;
//
//     return guild.championId;
// }