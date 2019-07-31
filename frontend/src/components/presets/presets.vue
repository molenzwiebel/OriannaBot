<template>
    <div class="presets-dialog box">
        <div class="header"><h2>Add Preset Roles</h2></div>
        <div class="body">
            <p>Do you not want to manually add roles? Here are a bunch of the most common role configurations, bundled as presets for your convenience. Simply press a button to add them!</p>

            <div class="preset">
                <b>Region Roles</b>
                <p>A simple role for every region. Want to assign people that have an account on EUW the EUW role? This is the preset for you. This preset is the equivalent of "Assign Region Roles" in Orianna Bot v1.</p>
                <div class="load"><button @click.prevent="addPreset('region', {})">Load</button></div>
            </div>

            <div class="preset">
                <b>Ranked Tier Roles</b>
                <p>A preset of roles to assign the Platinum role to everyone in platinum, along with all the other tiers. Configurable per ranked queue. This preset is the equivalent of the "Assign Ranked Tier Roles" option in Orianna Bot v1.</p>
                <div class="load">
                    <select v-model="queue">
                        <option value="unselected" disabled>Select A Queue...</option>
                        <option value="RANKED_SOLO_5x5">Ranked Solo/Duo</option>
                        <option value="RANKED_FLEX_SR">Ranked Flex 5v5</option>
                        <option value="RANKED_FLEX_TT">Ranked Flex 3v3</option>
                        <option value="RANKED_TFT">Ranked TFT</option>
                        <option value="ANY">Any Ranked Queue</option>
                        <option value="HIGHEST">Player's Highest Ranked Queue (excluding TFT)</option>
                        <option value="HIGHEST_TFT">Player's Highest Ranked Queue (including TFT)</option>
                    </select>
                    <button :disabled="queue === 'unselected'" @click.prevent="addPreset('rank', { queue })">Load</button>
                </div>
            </div>

            <div class="preset">
                <b>Mastery Level Roles</b>
                <p>Just 7 different roles for every different level of champion mastery.</p>
                <div class="load">
                    <champion-dropdown v-model="masteryChampion"></champion-dropdown>
                    <button :disabled="!masteryChampion" @click.prevent="addPreset('mastery', { champion: masteryChampion })">Load</button>
                </div>
            </div>

            <div class="preset">
                <b>50K Mastery Increments</b>
                <p>Roles from 50k mastery up until 950k mastery on a single champion.</p>
                <div class="load">
                    <champion-dropdown v-model="fiftyChampion"></champion-dropdown>
                    <button :disabled="!fiftyChampion" @click.prevent="addPreset('step', { start: 50000, end: 950000, step: 50000, champion: fiftyChampion })">Load</button>
                </div>
            </div>

            <div class="preset">
                <b>100K Mastery Increments</b>
                <p>Roles from 100k mastery up until 900k mastery on a single champion.</p>
                <div class="load">
                    <champion-dropdown v-model="hundredChampion"></champion-dropdown>
                    <button :disabled="!hundredChampion" @click.prevent="addPreset('step', { start: 100000, end: 900000, step: 100000, champion: hundredChampion })">Load</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import ChampionDropdown from "../champion-dropdown/champion-dropdown.vue";

    export default {
        props: { id: null },
        components: { ChampionDropdown },
        data() {
            return {
                masteryChampion: null,
                fiftyChampion: null,
                hundredChampion: null,
                queue: "unselected"
            };
        },
        methods: {
            async addPreset(type: string, args: any) {
                await this.$root.submit("/api/v1/server/" + this.id + "/role/preset/" + type, "POST", args);
                this.$emit("close", true);
            }
        }
    };
</script>

<style lang="stylus" scoped>
    .presets-dialog
        max-width 800px

        & p
            margin 0

        .preset
            margin-top 20px

            select
                width auto
                padding-right 20px

            select, .champion-dropdown
                margin-right 10px

            p
                margin 4px 0

            .load
                display flex
                align-items center

            .load button
                background-color transparent
                height 40px
                line-height 40px
                text-align center
                border 1px solid #c1c1c1
                color #333
                width auto
                padding 0 10px
                cursor pointer
                transition 0.2s ease

                &:focus
                    outline none

                &:hover:not([disabled])
                    border-color #1f9fde

                &[disabled]
                    color #8f8f8f
                    cursor not-allowed
</style>