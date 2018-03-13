import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import AddAccountComponent from "../add-account/add-account.vue";

interface UserAccount {
    username: string;
    region: string;
    account_id: number;
    summoner_id: number;
}

interface UserDetails {
    snowflake: string;
    username: string;
    avatar: string;
    accounts: UserAccount[];
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
        const result = await this.$root.displayModal<UserAccount>(AddAccountComponent, {});
        if (!result) return;

        // Don't add if the user already added an account.
        if (this.user.accounts.some(x => x.region === result.region && x.username === result.username)) return;

        this.user.accounts.push(result);
    }

    /**
     * Deletes the specified account.
     */
    async deleteAccount(account: UserAccount) {
        // TODO: Should probably ask for verification. :)
        await this.$root.submit("/api/v1/user/accounts", "DELETE", account);
        this.user.accounts.splice(this.user.accounts.indexOf(account), 1);
    }
}