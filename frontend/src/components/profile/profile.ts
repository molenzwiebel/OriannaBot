import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import Dialog from "../dialog/dialog.vue";
import AddAccountComponent from "../add-account/add-account.vue";
import ImportAccountsWizard from "../import-accounts/import-accounts.vue";

interface UserAccount {
    username: string;
    region: string;
    account_id: string;
    summoner_id: string;
    primary: boolean;
    show_in_profile: boolean;
    include_region: boolean;
}

interface UserDetails {
    snowflake: string;
    username: string;
    avatar: string;
    accounts: UserAccount[];
    treat_as_unranked: boolean;
    language: string | "";
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
    languages = [{ code: "en-US", language: "English" }];
    user: UserDetails = <any>null; // required for vue to register the binding

    async mounted() {
        // Load languages async.
        this.$root.get<any[]>("/api/v1/languages").then(langs => {
            this.languages = langs!;
        });

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
     * Prompts for the user to add accounts using the reddit championmains flair system.
     */
    async importRedditAccounts() {
        const result = await this.$root.displayModal<boolean | null>(ImportAccountsWizard, {});
        if (!result) return;

        // Reload user data to show the new accounts.
        this.user = (await this.$root.get<UserDetails>("/api/v1/user"))!;
    }

    /**
     * Deletes the specified account.
     */
    async deleteAccount(account: UserAccount) {
        const response = await this.$root.displayModal<boolean | null>(Dialog, {
            title: "Are you sure?",
            details: "Do you really want to remove <b>" + account.username + "</b>? You will have to reverify your account should you decide to add it again.",
            buttons: [{
                value: false, text: "Cancel", bg: "white", fg: "#333"
            }, {
                value: true, text: "Remove", bg: "red", fg: "white", border: "red"
            }]
        });
        if (!response) return;

        await this.$root.submit("/api/v1/user/accounts", "DELETE", account);
        this.user.accounts.splice(this.user.accounts.indexOf(account), 1);
    }

    /**
     * Updates the two different privacy settings.
     */
    updatePrivacySettings() {
        this.$root.submit("/api/v1/user", "PATCH", {
            treat_as_unranked: this.user.treat_as_unranked
        });
    }

    /**
     * Updates the language if a user selects a different value.
     */
    updateLanguage(evt: InputEvent) {
        const val: string = (<HTMLSelectElement>evt.target).value;

        this.user.language = val;
        this.$root.submit("/api/v1/user", "PATCH", {
            language: val
        });
    }

    async handlePrimarySet(acc: UserAccount) {
        if (acc.primary) return;

        for (const account of this.user.accounts) {
            account.primary = acc === account;
        }

        this.$root.submit("/api/v1/user/account/" + acc.account_id, "PATCH", {
            primary: true
        });
    }

    async handlePrivacyUpdate(acc: UserAccount) {
        this.$root.submit("/api/v1/user/account/" + acc.account_id, "PATCH", {
            show_in_profile: acc.show_in_profile,
            include_region: acc.include_region
        });
    }
}