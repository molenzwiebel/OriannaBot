import Vue from "vue";
import Component from "vue-class-component";
import Verification from "../verification/verification.vue";
import App from "../app/app";

interface Summoner {
    name: string;
    code: string;
}

@Component({
    components: { Verification }
})
export default class AddAccountWizard extends Vue {
    $root: App;

    nextButton = "Next";
    detailsError = "";
    _dirty = false;

    name: string = "";
    region: string = "disabled";
    summoner: Summoner = <any>null;

    /**
     * Responsible for changing the text of the next button.
     */
    handleTabChange(oldIndex: number, newIndex: number) {
        if (newIndex === 0 && this.summoner) {
            this.summoner = <any>null;
            (<any>this.$refs["wizard"]).reset();
        }

        this.nextButton = newIndex === 1 ? "Validate" : "Next";
    }

    async requestSummoner() {
        if (!this.name || !this.region || this.region === "disabled") {
            this.detailsError = "Please enter your summoner name and region.";
            throw new Error("");
        }

        const summ = /*await this.$root.submit("/api/v1/summoner", "POST", {
            username: this.name,
            region: this.region
        });*/{ name: "Test", code: "abcdef" };

        if (!summ) {
            this.detailsError = "Summoner not found. Use your summoner name, not login name.";
            throw new Error("");
        }

        this.summoner = summ;
        return true;
    }
}