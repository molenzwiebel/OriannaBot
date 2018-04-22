import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import { API_HOST } from "../../config";

@Component({
})
export default class ImportAccountsWizard extends Vue {
    $root: App;

    popup: Window | null = null;

    /**
     * Opens the reddit verification popup for the user to link
     * with us.
     */
    openPopup() {
        if (this.popup) return;
        this.popup = window.open(API_HOST + "/api/v1/reddit", "Verify Reddit Account", "width=450,height=600");

        const listener = (ev: MessageEvent) => {
            if (!ev.data.type || ev.data.type !== "reddit" || !ev.data.result) return;
            window.removeEventListener("message", listener);

            // TODO: Maybe display the error if there was one?
            this.popup!.close();
            this.$emit("close", ev.data.result.ok);
        };
        window.addEventListener("message", listener);
    }
}