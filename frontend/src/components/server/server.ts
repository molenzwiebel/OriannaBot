import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";

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
    blacklisted_channnels: string[];
    discord: {
        channels: { id: string, name: string }[];
        roles: { id: string, name: string }[];
    }
}

@Component({
})
export default class ServerProfile extends Vue {
    $root: App;
    server: ServerDetails = <any>null; // required for vue to register the binding

    async mounted() {
        // Load user details. Will error if the user is not logged in.
        this.server = (await this.$root.get<ServerDetails>("/api/v1/server/" + this.$route.params.id))!;
    }
}