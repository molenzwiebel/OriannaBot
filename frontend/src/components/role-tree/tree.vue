<!-- I would like to pre-emptively apologise for the mess below. It was the simplest way to implement this. -->

<template>
    <div class="tree">
        <span>The player </span>
        <select v-model="state.type">
            <option value="mastery_level">is at least mastery level</option>
            <option value="mastery_score">has a mastery score of</option>
            <option value="total_mastery_score">has a total mastery score of</option>
            <option value="ranked_tier">has a ranked tier</option>
            <option value="champion_play_count">has played at least</option>
            <option value="server">has an account on </option>
        </select>

        <template v-if="state.type === 'mastery_level'">
            <masked-input :mask="numberMask" v-model="state.value" placeholder="level"></masked-input>
            <span> on </span>
            <champion-dropdown v-model="state.champion"></champion-dropdown>
        </template>

        <template v-if="state.type === 'mastery_score'">
            <select v-model="state.compare_type">
                <option value="at_least">at least</option>
                <option value="at_most">at most</option>
                <option value="between">between</option>
            </select>

            <template v-if="state.compare_type === 'at_least' || state.compare_type === 'at_most'">
                <masked-input :mask="numberMask" v-model="state.value" placeholder="100,000"></masked-input>
                <span> points on </span>
                <champion-dropdown v-model="state.champion"></champion-dropdown>
            </template>

            <template v-if="state.compare_type === 'between'">
                <masked-input :mask="numberMask" v-model="state.min" placeholder="50,000"></masked-input>
                <span> and </span>
                <masked-input :mask="numberMask" v-model="state.max" placeholder="100,000"></masked-input>
                <span> points on </span>
                <champion-dropdown v-model="state.champion"></champion-dropdown>
            </template>
        </template>

        <template v-if="state.type === 'total_mastery_score'">
            <select v-model="state.compare_type">
                <option value="at_least">at least</option>
                <option value="at_most">at most</option>
                <option value="between">between</option>
            </select>

            <template v-if="state.compare_type === 'at_least' || state.compare_type === 'at_most'">
                <masked-input :mask="numberMask" v-model="state.value" placeholder="100,000"></masked-input>
                <span> points total</span>
            </template>

            <template v-if="state.compare_type === 'between'">
                <masked-input :mask="numberMask" v-model="state.min" placeholder="50,000"></masked-input>
                <span> and </span>
                <masked-input :mask="numberMask" v-model="state.max" placeholder="100,000"></masked-input>
                <span> points total</span>
            </template>
        </template>

        <template v-if="state.type === 'ranked_tier'">
            <select v-model="state.compare_type">
                <option value="higher">higher than</option>
                <option value="lower">lower than</option>
                <option value="equal">equal to</option>
            </select>

            <template v-if="['higher', 'lower', 'equal'].indexOf(state.compare_type) !== -1">
                <select v-model="state.tier">
                    <option value="0">Unranked</option>
                    <option value="1">Bronze</option>
                    <option value="2">Silver</option>
                    <option value="3">Gold</option>
                    <option value="4">Platinum</option>
                    <option value="5">Diamond</option>
                    <option value="6">Master</option>
                    <option value="7">Challenger</option>
                </select>

                <span>in</span>

                <select v-model="state.queue">
                    <option value="RANKED_SOLO_5x5">Ranked Solo/Duo</option>
                    <option value="RANKED_FLEX_SR">Ranked Flex 5v5</option>
                    <option value="RANKED_FLEX_TT">Ranked Flex 3v3</option>
                </select>
            </template>
        </template>

        <template v-if="state.type === 'champion_play_count'">
            <masked-input :mask="numberMask" v-model="state.count" placeholder="25"></masked-input>
            <span>games played on</span>
            <champion-dropdown v-model="state.champion"></champion-dropdown>
            <span>in any ranked queue this season</span>
        </template>

        <template v-if="state.type === 'server'">
            <select v-model="state.region">
                <option value="EUW">EUW</option>
                <option value="EUNE">EUNE</option>
                <option value="NA">NA</option>
                <option value="OCE">OCE</option>
                <option value="BR">BR</option>
                <option value="LAN">LAN</option>
                <option value="LAS">LAS</option>
                <option value="TR">TR</option>
                <option value="RU">RU</option>
            </select>
        </template>
    </div>
</template>

<script lang="ts">
    import ChampionDropdown from "../champion-dropdown/champion-dropdown.vue";
    import createNumberMask from "text-mask-addons/dist/createNumberMask";

    const KEYS: { [key: string]: string[] | ((data: any) => string[]) } = {
        mastery_level: ["value", "champion"],
        mastery_score: d => d.compare_type === "between" ? ["compare_type", "champion", "min", "max"] : ["compare_type", "champion", "value"],
        total_mastery_score: d => d.compare_type === "between" ? ["compare_type", "min", "max"] : ["compare_type", "value"],
        ranked_tier: ["compare_type", "tier", "queue"],
        champion_play_count: ["count", "champion"],
        server: ["region"]
    };
    const NUMBERS = ["value", "champion", "min", "max", "count"];

    export default {
        props: { options: Object },
        components: { ChampionDropdown },
        data() {
            return {
                state: this.options,
                numberMask: (<any>createNumberMask)({
                    prefix: ""
                })
            }
        },
        mounted() {
            const emitChange = () => this.$emit("change", {
                valid: this.valid,
                options: this.total
            });

            this.$watch("total", emitChange);
            this.$watch("valid", emitChange);
        },
        computed: {
            valid() {
                if (!this.state.type) return false;
                const keys = KEYS[this.state.type];
                if (!keys) return false;

                for (const key of typeof keys === "function" ? keys(this.state) : keys) {
                    if (!this.state[key]) return false;
                }

                return true;
            },
            total() {
                if (!this.valid) return null;
                const keys = KEYS[this.state.type];

                const ret: { [key: string]: any } = { type: this.state.type };
                for (const key of typeof keys === "function" ? keys(this.state) : keys) {
                    ret[key] = NUMBERS.indexOf(key) !== -1 ? +this.state[key].replace(/,./g, "") : this.state[key];
                }

                return ret;
            }
        }
    };
</script>

<style lang="stylus">
    .tree
        display flex
        align-items center
        flex-wrap wrap

        select, input
            background-color transparent
            border none
            border-bottom 1px solid
            height 30px
            font-size 16px
            transition 0.2s ease
            color black
            padding 0

            &:focus
                outline none
                border-bottom-color #3380e5

        span, select, input, .champion-dropdown
            margin 4px 4px

        span
            font-family Roboto
            font-size 16px

        select
            width auto
            padding-right 20px
            display inline-block

        .champion-dropdown img
            height 30px !important
            margin-right 5px !important
</style>