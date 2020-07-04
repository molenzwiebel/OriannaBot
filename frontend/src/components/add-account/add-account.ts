import Vue from "vue";
import Component from "vue-class-component";
import Verification from "../verification/verification.vue";
import App from "../app/app";

interface Summoner {
    username: string;
    code: string;
    targetSummonerIcon: number;
    taken: boolean;
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
    summoner: Summoner = <any>null;

    /**
     * Responsible for changing the text of the next button.
     */
    handleTabChange(oldIndex: number, newIndex: number) {
        if (newIndex === 0 && this.summoner) {
            // Make sure that we can't go to step 1, change stuff, then navigate to step 2 without checking.
            this.summoner = <any>null;
            (<any>this.$refs["wizard"]).reset();
        }

        this.nextButton = newIndex === 1 ? "Validate" : "Next";
    }

    /**
     * Checks if the summoner entered exists, and loads the code needed to verify.
     */
    async requestSummoner() {
        if (!this.name || !this.region || this.region === "disabled") {
            this.detailsError = "Please enter your summoner name and region.";
            throw new Error("");
        }

        const summ = await this.$root.submit<Summoner>("/api/v1/summoner", "POST", {
            username: this.name,
            region: this.region
        });

        if (!summ) {
            this.detailsError = "Summoner not found. Make sure to use your summoner name, not your login name.";
            throw new Error("");
        }

        this.summoner = summ;
        return true;
    }

    /**
     * Checks if the user has changed their code to the given token.
     */
    async verifySummoner() {
        const req = await this.$root.submit<{ ok: boolean }>("/api/v1/user/accounts", "POST", {
            code: this.summoner.code
        });

        if (!req || !req.ok) {
            this.verificationError = "Failed to verify. Ensure that you have equipped the relevant icon. Note that it may take a moment for your icon to update.";
            throw new Error("");
        }

        return true;
    }
}