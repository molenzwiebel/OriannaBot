import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import ChampionDropdown from "../champion-dropdown/champion-dropdown.vue";
import RoleConditions from "../role-tree/role-conditions.vue";
import { default as RoleConditionsTy } from "../role-tree/role-conditions";
import PresetsModal from "../presets/presets.vue";

export type RoleCombinator = {
    type: "all"
} | {
    type: "one"
} | {
    type: "at_least",
    amount: number
};

export interface Role {
    id: number;
    name: string;
    snowflake: string;
    announce: boolean;
    conditions: {
        type: string;
        options: any;
    }[];
    combinator: RoleCombinator;
}

export interface DiscordRole {
    id: string;
    name: string;
    color: string;
    position: number;
}

export interface ServerDetails {
    snowflake: string;
    name: string;
    avatar: string;
    announcement_channel: string | null;
    default_champion: number | null;
    completed_intro: boolean;
    roles: Role[];
    blacklisted_channels: string[];
    nickname_pattern: string;
    server_leaderboard_role_requirement: string | null;
    discord: {
        channels: { id: string, name: string }[];
        roles: DiscordRole[];
        highestRole: number;
    };
    engagement: {
        type: "on_join"
    } | {
        type: "on_command"
    } | {
        type: "on_react",
        channel: string,
        emote: string // customName:id
    };
    language: string;
}

@Component({
    components: { ChampionDropdown, RoleConditions }
})
export default class ServerProfile extends Vue {
    $root: App;
    server: ServerDetails = <any>null; // required for vue to register the binding
    blacklistChannel = "disabled";
    roleName = "";
    message = "";
    rolesDirty = false;
    nickEnabled = false;
    timeoutID: number = 0;
    languages: { code: string, name: string }[] = [{ code: "en-US", name: "English" }];
    $refs: { roleElements: RoleConditionsTy[] };

    async mounted() {
        // Load languages async.
        this.$root.get<any[]>("/api/v1/languages").then(res => this.languages = res!);

        // Load user details. Will error if the user is not logged in.
        this.server = (await this.$root.get<ServerDetails>("/api/v1/server/" + this.$route.params.id))!;
        this.nickEnabled = this.server.nickname_pattern !== "";

        // Redirect to intro if it's not yet complete.
        if (!this.server.completed_intro) {
            this.$router.push("/server/" + this.$route.params.id + "/intro");
        }
    }

    /**
     * Updates the selected announcement channel with the server.
     */
    private async updateAnnouncementChannel(evt: Event) {
        let val: string | null = (<HTMLSelectElement>evt.target).value;
        if (val === "null") val = null;

        this.server.announcement_channel = val;
        await this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            announcement_channel: val
        });

        if (val) {
            this.showMessage(`Announcements will now be sent in #${this.getChannelName(val)}!`);
        } else {
            this.showMessage("Announcements are now turned off.");
        }
    }

    /**
     * Updates the selected leaderboard role requirement channel with the server.
     */
    private async updateLeaderboardRoleRequirement(evt: Event) {
        let val: string | null = (<HTMLSelectElement>evt.target).value;
        if (val === "null") val = null;

        this.server.server_leaderboard_role_requirement = val;
        await this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            server_leaderboard_role_requirement: val
        });

        if (val) {
            this.showMessage(`Only members with @${this.server.discord.roles.find(x => x.id == val)!.name} will be included in the server leaderboard.`);
        } else {
            this.showMessage("All members will be shown in the server leaderboard.");
        }
    }

    /**
     * Updates the selected announcement channel with the server.
     */
    private async updateEngagement(evt: Event) {
        const type = (<HTMLSelectElement>evt.target).value;

        if (type === "on_command" || type === "on_join") {
            this.server.engagement = {
                type
            };
        } else {
            this.server.engagement = {
                type: "on_react",
                channel: this.server.discord.channels[0].id,
                emote: "Orianna:411977322510680067" // use a "sensible" default
            };
        }

        await this.saveEngagement();
    }

    /**
     * Updates the preferred language of the server.
     */
    private async updateLanguage(evt: Event) {
        const val: string = (<HTMLSelectElement>evt.target).value;

        this.server.language = val;
        await this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            language: val
        });

        this.showMessage(`Updated server language.`);
    }

    /**
     * Saves the current engagement options for the server.
     */
    private async saveEngagement() {
        await this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            engagement: this.server.engagement
        });

        this.showMessage("Saved engagement options.");
    }

    /**
     * Updates the selected default champion with the server.
     */
    private async updateDefaultChampion(champ: number) {
        this.server.default_champion = champ;
        await this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            default_champion: champ
        });

        this.showMessage(champ ? "Updated default server champion!" : "Default champion removed. All commands will now require a champion name.");
    }

    /**
     * Updates the nickname pattern with the server.
     */
    private async updateNicknamePattern() {
        await this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            nickname_pattern: this.nickEnabled ? this.server.nickname_pattern : ""
        });

        this.showMessage(this.nickEnabled ? "Updated nickname pattern!" : "Disabled automatic nickname enforcement.");
    }

    /**
     * Marks the currently selected blacklist channel as being blacklisted.
     */
    private async addBlacklistedChannel() {
        if (this.blacklistChannel === "disabled") return;

        await this.$root.submit("/api/v1/server/" + this.$route.params.id + "/blacklisted_channels", "POST", {
            channel: this.blacklistChannel
        });
        this.showMessage(`Will now ignore all commands sent in #${this.getChannelName(this.blacklistChannel)}.`);

        this.server.blacklisted_channels.push(this.blacklistChannel);
        this.blacklistChannel = "undefined";
    }

    /**
     * Removes the specified channel ID from the blacklist.
     */
    private async removeBlacklist(id: string) {
        await this.$root.submit("/api/v1/server/" + this.$route.params.id + "/blacklisted_channels", "DELETE", {
            channel: id
        });
        this.showMessage(`Will no longer ignore commands sent in #${this.getChannelName(id)}.`);

        this.server.blacklisted_channels.splice(this.server.blacklisted_channels.indexOf(id), 1);
    }

    /**
     * Deletes the specified role.
     */
    private async deleteRole(role: Role) {
        await this.$root.submit("/api/v1/server/" + this.$route.params.id + "/role/" + role.id, "DELETE", {});
        this.showMessage(`Removed ${role.name}.`);
        this.server.roles.splice(this.server.roles.indexOf(role), 1);
    }

    /**
     * Adds a new role.
     */
    private async addRole() {
        if (!this.roleName) return;
        const role = await this.$root.submit("/api/v1/server/" + this.$route.params.id + "/role", "POST", {
            name: this.roleName
        });
        if (!role) return;
        this.showMessage(`Added ${this.roleName}!`);

        this.server.roles.push(role);
        this.roleName = "";
    }

    /**
     * Opens the presets modal.
     */
    private async openPresetsModal() {
        const res = await this.$root.displayModal<boolean | null>(PresetsModal, { id: this.$route.params.id });
        if (!res) return;

        // Reload roles, since we don't know what the user added.
        this.server = (await this.$root.get<ServerDetails>("/api/v1/server/" + this.$route.params.id))!;
    }

    /**
     * Saves all dirty roles.
     */
    private async saveUnsavedRoles() {
        await Promise.all(this.$refs.roleElements.filter(x => x.dirty).map(x => x.save()));
        this.showMessage("All roles saved!");
    }

    /**
     * Recomputes if any roles are dirty.
     */
    private updateDirty() {
        this.rolesDirty = this.$refs.roleElements.some(x => x.dirty);
    }

    /**
     * Shows a small message at the bottom.
     */
    private showMessage(msg: string) {
        this.message = msg;
        if (this.timeoutID) clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(() => {
            this.message = "";
        }, 2000);
    }

    /**
     * Finds the channel name for the specified ID. Assumes the channel exists.
     */
    private getChannelName(id: string) {
        return this.server.discord.channels.find(x => x.id === id)!.name;
    }

    /**
     * Returns all the blacklisted channels in the server.
     */
    get blacklistedChannels() {
        if (!this.server) return [];
        return this.server.discord.channels.filter(x => this.server.blacklisted_channels.indexOf(x.id) !== -1);
    }

    /**
     * Returns all the channels that are _not_ blacklisted in the server.
     */
    get unblacklistedChannels() {
        if (!this.server) return [];
        return this.server.discord.channels.filter(x => this.server.blacklisted_channels.indexOf(x.id) === -1);
    }

    /**
     * @returns all currently known discord role names
     */
    get roleNames() {
        return this.server.discord.roles.map(x => x.name);
    }

    /**
     * @returns an example of a nickname generated by the nickname pattern for this server
     */
    get nickExample() {
        return this.server.nickname_pattern
            .replace("{region}", "NA")
            .replace("{username}", "Doublelift")
            .slice(0, 32);
    }

    /**
     * @returns the URL to the discord CDN for the current engagement emote
     */
    get emoteImage() {
        if (this.server.engagement.type !== "on_react") return "";

        const emote = this.server.engagement.emote;
        if (!emote.includes(":")) return "";

        const [name, id] = emote.split(":");
        return `https://cdn.discordapp.com/emojis/${id}.png?v=1`;
    }
}