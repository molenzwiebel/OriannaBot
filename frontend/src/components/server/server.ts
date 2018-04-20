import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import ChampionDropdown from "../champion-dropdown/champion-dropdown.vue";
import RoleConditions from "../role-tree/role-conditions.vue";

export interface Role {
    id: number;
    name: string;
    snowflake: string;
    announce: boolean;
    conditions: {
        type: string;
        options: any;
    }[];
}

export interface DiscordRole {
    id: string;
    name: string;
    color: string;
}

interface ServerDetails {
    snowflake: string;
    name: string;
    avatar: string;
    announcement_channel: string | null;
    default_champion: number | null;
    roles: Role[];
    blacklisted_channels: string[];
    discord: {
        channels: { id: string, name: string }[];
        roles: DiscordRole[];
    }
}

@Component({
    components: { ChampionDropdown, RoleConditions }
})
export default class ServerProfile extends Vue {
    $root: App;
    server: ServerDetails = <any>null; // required for vue to register the binding
    blacklistChannel = "disabled";
    roleName = "";

    async mounted() {
        // Load user details. Will error if the user is not logged in.
        this.server = (await this.$root.get<ServerDetails>("/api/v1/server/" + this.$route.params.id))!;
    }

    /**
     * Updates the selected announcement channel with the server.
     */
    private updateAnnouncementChannel(evt: Event) {
        this.server.announcement_channel = (<HTMLSelectElement>evt.target).value;
        this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            announcement_channel: (<HTMLSelectElement>evt.target).value
        });
    }

    /**
     * Updates the selected default champion with the server.
     */
    private updateDefaultChampion(champ: number) {
        this.server.default_champion = champ;
        this.$root.submit("/api/v1/server/" + this.$route.params.id, "PATCH", {
            default_champion: champ
        });
    }

    /**
     * Marks the currently selected blacklist channel as being blacklisted.
     */
    private addBlacklistedChannel() {
        if (this.blacklistChannel === "disabled") return;

        this.$root.submit("/api/v1/server/" + this.$route.params.id + "/blacklisted_channels", "POST", {
            channel: this.blacklistChannel
        });

        this.server.blacklisted_channels.push(this.blacklistChannel);
        this.blacklistChannel = "undefined";
    }

    /**
     * Removes the specified channel ID from the blacklist.
     */
    private removeBlacklist(id: string) {
        this.$root.submit("/api/v1/server/" + this.$route.params.id + "/blacklisted_channels", "DELETE", {
            channel: id
        });

        this.server.blacklisted_channels.splice(this.server.blacklisted_channels.indexOf(id), 1);
    }

    /**
     * Deletes the specified role.
     */
    private deleteRole(role: Role) {
        this.$root.submit("/api/v1/server/" + this.$route.params.id + "/role/" + role.id, "DELETE", {});
        this.server.roles.splice(this.server.roles.indexOf(role), 1);
    }

    /**
     * Adds a new role.
     */
    private async addRole() {
        const role = await this.$root.submit("/api/v1/server/" + this.$route.params.id + "/role", "POST", {
            name: this.roleName
        });
        if (!role) return;

        this.server.roles.push(role);
        this.roleName = "";
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
}