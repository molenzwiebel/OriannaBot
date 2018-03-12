import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import AddAccountComponent from "../add-account/add-account.vue";

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
        // Load user details. Will error if the user is not logged in.
        this.user = (await this.$root.get<UserDetails>("/api/v1/user"))!;
    }

    /**
     * Prompts for the user to add an account. Internally adds the account to the
     * list of accounts (without refreshing) if an account was added.
     */
    async addAccount() {
        const result = await this.$root.displayModal<{ name: string, region: string, id: number, accountId: number }>(AddAccountComponent, {});
        if (!result) return;

        // Don't add if the user already added an account.
        if (this.user.accounts.some(x => x.region === result.region && x.username === result.name)) return;

        this.user.accounts.push({
            username: result.name,
            region: result.region,
            account_id: result.accountId,
            summoner_id: result.id
        });
    }
}