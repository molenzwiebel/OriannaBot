import Vue from "vue";
import Component from "vue-class-component";
import Verification from "../verification/verification.vue";
import App from "../app/app";

export interface PendingAccount {
    puuid: string;
    gameName: string;
    tagline: string;
    targetSummonerIcon: number;
    taken: boolean;
    code: string;
    region: string;
}

@Component({
    components: { Verification }
})
export default class AddAccountWizard extends Vue {
    $root: App;

    nextButton = "Next";
    detailsError = "";
    verificationError = "";

    name: string = "";
    region: string = "disabled";
    pending: PendingAccount = <any>null;

    /**
     * Responsible for changing the text of the next button.
     */
    handleTabChange(oldIndex: number, newIndex: number) {
        if (newIndex === 0 && this.pending) {
            // Make sure that we can't go to step 1, change stuff, then navigate to step 2 without checking.
            this.pending = <any>null;
            (<any>this.$refs["wizard"]).reset();
        }

        this.nextButton = newIndex === 1 ? "Validate" : "Next";
    }

    /**
     * Checks if the summoner entered exists, and loads the code needed to verify.
     */
    async requestSummoner() {
        if (!this.name || !this.region || this.region === "disabled") {
            this.detailsError = "Please enter your Riot ID and region.";
            throw new Error("");
        }

        const riotIdMatch = /^([^#]{3,16})#(.{3,5})$/.exec(this.name);
        if (!riotIdMatch) {
            this.detailsError = "Invalid Riot ID. Your Riot ID must be of the format `game name#tagline` and not just your in-game name.";
            throw new Error("");
        }

        const summ = await this.$root.submit<PendingAccount>("/api/v1/summoner", "POST", {
            gameName: riotIdMatch[1],
            tagline: riotIdMatch[2],
            region: this.region
        });

        if (!summ) {
            this.detailsError = "Account not found. Ensure that you use the full Riot ID shown when hovering over your profile icon in the client, including #tagline.";
            throw new Error("");
        }

        this.pending = summ;
        return true;
    }

    /**
     * Checks if the user has changed their code to the given token.
     */
    async verifySummoner() {
        const req = await this.$root.submit<{ ok: boolean }>("/api/v1/user/accounts", "POST", {
            code: this.pending.code
        });

        if (!req || !req.ok) {
            this.verificationError = "Failed to verify. Ensure that you have equipped the relevant icon. Note that it may take a moment for your icon to update.";
            throw new Error("");
        }

        return true;
    }
}