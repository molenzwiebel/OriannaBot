import Vue from "vue";
import Component from "vue-class-component";
import App from "../app/app";
import { Role, DiscordRole } from "../server/server";
import Tree from "./tree.vue";

@Component({
    components: { Tree },
    props: {
        role: Object,
        discordRoles: Array
    }
})
export default class RoleConditions extends Vue {
    $root: App;

    role: Role;
    conditions: { valid: boolean, opts: any }[] = [];

    discordRoles: DiscordRole[];
    expanded = true;
    dirty = false; // if we received a change event and haven't saved yet

    mounted() {
        this.conditions = this.role.conditions.map(x => ({
            valid: true,
            opts: { type: x.type, ...x.options }
        }));
    }

    private handleChange(state: { valid: boolean, options: any }, condition: { valid: boolean, opts: any }) {
        this.dirty = true;
        condition.valid = state.valid;
        condition.opts = state.options;
    }

    private addCondition() {
        this.conditions.push({ valid: false, opts: {} });
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
}