import MessageHandler from "../message-handler";
import { DiscordServer, DiscordServerModel, User, UserModel } from "../../database";

/**
 * Checks to see if the specified message was sent in a guild where Orianna is present
 * and the setup is completed. If not, replies with an error message and returns undefined.
 */
export async function expectServer(this: MessageHandler, msg: eris.Message): Promise<DiscordServer | undefined> {
    if (!msg.channel.guild) {
        await this.error(msg, {
            title: ":question: Which server?",
            description: "I'll need to know which server you are talking about. Try using this command in the target server."
        });
        return;
    }

    const server = await DiscordServerModel.findBy({ snowflake: msg.channel.guild.id });
    if (!server || !server.setupCompleted) {
        await this.error(msg, {
            title: ":turtle: Slow Down!",
            description: "The owner of this server hasn't yet finished configuring me. Come back later!"
        });
        return;
    }

    return server;
}

/**
 * Tries to find the targeted user in the specified message. If the message contains a mention,
 * that user is tried (an error is returned if the user doesn't exist in the database). If there
 * is no mention, the current user is used as target (again sending an error if they are not in
 * the database). Returns undefined and replies with an error if no target can be found.
 */
export async function expectUser(this: MessageHandler, msg: eris.Message): Promise<User | undefined> {
    const suitableMentions = msg.mentions.filter(x => !x.bot);
    const mentionTarget = suitableMentions[0];

    if (mentionTarget) {
        const user = await UserModel.findBy({ snowflake: mentionTarget.id });

        if (!user) {
            await this.error(msg, {
                title: ":question: Who is " + mentionTarget.username + "?",
                description: mentionTarget.mention + " doesn't seem to be in my database. They can configure me by using `@<me> configure`."
            });
            return;
        }

        return user;
    }

    const user = await UserModel.findBy({ snowflake: msg.author.id });
    if (!user) {
        await this.error(msg, {
            title: ":question: Who are you?",
            description: "You don't seem to be in my database. You can start configuring me with `@<me> configure`."
        });
        return;
    }

    return user;
}

/**
 * Tries to find a champion name in the specified message. If a champion cannot be found,
 * an attempt is made to use the configured champion in the current discord. Returns the champion
 * id on success, or 0 on failure. An error reply will automatically be dispatched.
 */
export async function expectChampion(this: MessageHandler, msg: eris.Message): Promise<number> {
    // Normalize champion names.
    const names = Object.keys(this.client.championData).map(k => ({ champ: this.client.championData[+k], name: this.client.championData[+k].name.toLowerCase().replace(/\W/g, "") }));

    // Normalize content.
    const content = msg.content.toLowerCase().replace(/\W/g, "");

    // If we have a direct match, return that.
    const match = names.find(c => content.indexOf(c.name) !== -1);
    if (match) return match.champ.id;

    // Try to find a guild.
    const guild = await this.expectServer(msg);
    if (!guild) return 0;

    return guild.championId;
}