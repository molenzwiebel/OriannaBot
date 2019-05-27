import { Command } from "../command";

const HOUSES: { [key: number]: string } = {
    4086: "Faceless",
    4087: "Warband",
    4088: "United",
    4089: "Council"
};

const HouseCommand: Command = {
    name: "Receive Trials House Role",
    smallDescription: "Gives you a Discord role based on which MSI trials house you chose.",
    description: `
This command checks the summoner icons of all your linked accounts, looking for the role icons you receive when you join a house during the MSI trials event. Based on which house (or houses) you chose, you will receive the appropriate roles.
`.trim(),
    keywords: ["house", "houses", "council", "united", "faceless", "warband", "faction"],
    async handler({ ctx, error, msg, ok, client, user: fetchUser, guild }) {
        const user = await fetchUser();
        await user.$loadRelated("[accounts]");

        if (!user.accounts!.length) return error({
            title: `🔍 You Have No Accounts Linked`,
            description: `To receive a role based on which trials house you chose, you need to link your League accounts with me. You can add some using \`@Orianna Bot configure\` and following the instructions.`
        });

        let received: string[] = [];
        for (const acc of user.accounts!) {
            const data = await client.riotAPI.getSummonerById(acc.region, acc.summoner_id);
            if (!data) continue;
            const house = HOUSES[data.profileIconId];
            if (!house) continue;
            const role = guild.roles.find(x => x.name === house);
            if (!role) continue;
            if (received.includes(role.id)) continue;

            msg.member!.addRole(role.id, "Is In House").catch(() => { /* Ignored. */ });
            received.push(role.id);
        }

        if (!received.length) {
            return error({
                title: "🔍 No Houses Found",
                description: "None of your accounts linked with Orianna Bot have a house icon selected. Make sure to select your faction icon in League, then rerun this command. It may take a bit for the change to register.",
                thumbnail: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/4089.jpg"
            });
        }

        return ok({
            title: "✅ Roles Received!",
            description: `You received ${received.map(x => "<@&" + x + ">").join(', ')}.`
        });
    }
};
export default HouseCommand;