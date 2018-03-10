import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";

interface UserDetails {
    snowflake: string;
    username: string;
    avatar: string;
    accounts: {
        username: string,
        region: string,
        account_id: number,
        summoner_id: number
    }[];
    guilds: {
        id: string,
        name: string,
        icon: string
    }[];
}

@Component({
})
export default class UserProfile extends Vue {
    $root: App;
    user: UserDetails = <any>null; // required for vue to register the binding

    async mounted() {
        this.user = (await this.$root.get<UserDetails>("/api/v1/user"))!;
    }
}