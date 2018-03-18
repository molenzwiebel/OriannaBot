import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import ChampionDropdown from "../champion-dropdown/champion-dropdown.vue";

interface ServerDetails {
    snowflake: string;
    name: string;
    avatar: string;
    announcement_channel: string | null;
    default_champion: number | null;
    roles: {
        name: string;
        snowflake: string;
        announce: number;
        conditions: {
            type: string;
            options: any;
        };
    }[];
    blacklisted_channels: string[];
    discord: {
        channels: { id: string, name: string }[];
        roles: { id: string, name: string }[];
    }
}

@Component({
    components: { ChampionDropdown }
})
export default class ServerProfile extends Vue {
    $root: App;
    server: ServerDetails = <any>null; // required for vue to register the binding
    blacklistChannel = "disabled";

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
}