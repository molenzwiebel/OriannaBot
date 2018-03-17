<template>
    <div class="champion-dropdown">
        <img :src="image">
        <select ref="select" @change="update">
            <template v-if="!champions.length">
                <option value="disabled" disabled selected>Loading...</option>
            </template>

            <template v-else>
                <option value="disabled" disabled :selected="!value">Select A Champion</option>
                <option :value="champ.id" v-for="champ in champions" :selected="value && value === champ.key">{{ champ.name }}</option>
            </template>
        </select>
    </div>
</template>

<script lang="ts">
    import { Champion, champions, ddragon } from "../../config";

    export default {
        props: ["value"],
        data() {
            return { champions: [] };
        },
        methods: {
            update() {
                this.$emit("input", this.champions.find((x: Champion) => x.id === this.$refs.select.value).key);
            }
        },
        async created() {
            this.champions = await champions();
        },
        computed: {
            image() {
                // The "no ban icon"
                if (!this.value) return "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png";

                const champ = this.champions.find((x: Champion) => x.key === this.value);
                return "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/champion/" + champ.id + ".png";
            }
        }
    };
</script>

<style lang="stylus" scoped>
    .champion-dropdown
        display flex

        img
            display inline-block
            margin-right 10px
            height 40px

        select
            display inline-block
            padding-right 20px
</style>