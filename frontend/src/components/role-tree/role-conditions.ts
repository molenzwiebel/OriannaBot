import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import Dialog from "../dialog/dialog.vue";
import RenameModal from "./rename-modal.vue";
import { Role, DiscordRole } from "../server/server";
import Tree from "./tree.vue";
import Combinator from "./combinator.vue";

@Component({
    components: { Tree, Combinator },
    props: {
        role: Object,
        highest: Number,
        discordRoles: Array
    }
})
export default class RoleConditions extends Vue {
    $root: App;

    role: Role;
    conditions: { valid: boolean, opts: any }[] = [];

    discordRoles: DiscordRole[];
    highest: number;
    expanded = false;
    dirty = false; // if we received a change event and haven't saved yet

    mounted() {
        this.conditions = this.role.conditions.map(x => ({
            valid: true,
            opts: { type: x.type, ...x.options }
        }));

        // If the combinator changes, mark as dirty (may not 100% be correct).
        this.$watch(() => JSON.stringify(this.role.combinator), () => {
            this.dirty = true;
            this.$emit("dirty");
        });
    }

    private handleChange(state: { valid: boolean, options: any }, condition: { valid: boolean, opts: any }) {
        this.dirty = true;
        this.$emit("dirty");
        condition.valid = state.valid;
        condition.opts = state.options;
    }

    /**
     * Opens up a simple dialog to rename this role.
     */
    private async renameRole() {
        await this.$root.displayModal(RenameModal, { role: this.role });
        this.dirty = true;
        this.$emit("dirty");
    }

    /**
     * Adds a new empty condition.
     */
    private addCondition() {
        this.conditions.push({ valid: false, opts: {} });
    }

    /**
     * Removes the specified condition.
     */
    private removeCondition(cond: any) {
        this.conditions.splice(this.conditions.indexOf(cond), 1);
    }

    /**
     * Finds or creates a discord role belonging to this Orianna role.
     */
    private async linkRole() {
        const res = await this.$root.submit<DiscordRole>("/api/v1/server/" + this.$route.params.id + "/role/" + this.role.id + "/link", "POST", {});
        if (!res) return;

        if (!this.discordRoles.some(x => x.id === res.id)) this.discordRoles.push(res);
        this.role.snowflake = res.id;
    }

    /**
     * Ask for confirmation, then emit delete event if accepted.
     */
    private async deleteRole() {
        const res = await this.$root.displayModal<boolean | null>(Dialog, {
            title: "Are you sure?",
            details: "Do you really want to delete <b>" + this.role.name + "</b>? This will not delete the associated Discord role.",
            buttons: [{
                value: false, text: "Cancel", bg: "white", fg: "#333"
            }, {
                value: true, text: "Delete Role", bg: "red", fg: "white", border: "red"
            }]
        });

        if (res) this.$emit("delete");
    }

    /**
     * Saves the role.
     */
    public async save() {
        if (!this.valid || !this.dirty) return;

        await this.$root.submit("/api/v1/server/" + this.$route.params.id + "/role/" + this.role.id, "POST", {
            name: this.role.name,
            announce: this.role.announce,
            combinator: this.role.combinator.type === "at_least" ? {
                type: "at_least",
                amount: +this.role.combinator.amount
            } : { type: this.role.combinator.type },
            conditions: this.conditions.map(x => ({
                type: x.opts.type,
                options: { ...x.opts, type: undefined }
            }))
        });
        this.dirty = false;
        this.$emit("dirty");
    }

    /**
     * @returns if all underlying conditions are valid
     */
    get valid() {
        return this.conditions.filter(x => x.valid).length === this.conditions.length;
    }

    /**
     * @returns the matching discord role for this role entry, or undefined if it does not exist
     */
    get matchingDiscord() {
        return this.discordRoles.filter(x => x.id === this.role.snowflake)[0];
    }

    /**
     * @returns the discord role color for this role entry, or black if it has none
     */
    get color() {
        return this.matchingDiscord ? this.matchingDiscord.color : "#0";
    }

    /**
     * @returns if our highest role is below the discord role this role refers to
     */
    get isBelowRole() {
        const matching = this.matchingDiscord;
        if (!matching) return false;

        return matching.position >= this.highest;
    }
}