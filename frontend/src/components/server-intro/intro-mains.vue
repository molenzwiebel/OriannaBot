<template>
    <div class="intro-specific">
        <div class="title">
            <p>Get started with Orianna Bot!</p>
            <span>Just a few more questions before you're done!</span>
        </div>

        <div class="sections">
            <div class="section">
                <p>What champion does your server focus?</p>

                <champion-dropdown v-model="champion"></champion-dropdown>

                <span>This champion will be used as the default champion for all champion-specific commands within your server. If you choose to also add some default mastery roles, they will apply for this champion.</span>
            </div>

            <div class="section" :class="!champion && 'dimmed'">
                <p>What roles do you want to assign?</p>

                <div class="role-presets">
                    <div class="preset">
                        <input type="checkbox" v-model="createRegionRoles">
                        <div class="info">
                            <p>Region Roles</p>
                            <span>Creates a role for all supported League regions. Assigns EUW to anyone that has an account on EUW.</span>
                        </div>
                    </div>

                    <div class="preset">
                        <input type="checkbox" v-model="createRankedRoles">
                        <div class="info">
                            <p>Ranked Roles</p>
                            <span>Creates a role for all ranked tiers. Assigns Platinum to anyone that is platinum in their highest queue.</span>
                        </div>
                    </div>

                    <div class="preset">
                        <input type="checkbox" v-model="createMasteryRoles">
                        <div class="info">
                            <p>Mastery Roles</p>
                            <span>Creates tiered roles for different levels of mastery on your default champion. You can edit these later.</span>
                            <select v-model="masteryRoleType">
                                <option value="levels">Mastery Levels (Level 1 - 7)</option>
                                <option value="50k">Mastery Per 50k (50k - 1m)</option>
                                <option value="100k">Mastery Per 100k (100k - 1m)</option>
                                <option value="250k">Mastery Per 250k (250k - 1m)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <span>This will pre-populate some roles for you, so you can get started with Orianna even faster. No Discord roles will be created. You'll be able to edit, add, remove or rename these roles later.</span>
            </div>

            <div class="section" :class="!champion && 'dimmed'">
                <p>Where do you want to see promotion announcements?</p>

                <select v-model="announceChannel">
                    <option value="null">Do Not Make Announcements</option>
                    <option disabled>──────────</option>
                    <option v-for="channel in channels" :value="channel.id">#{{ channel.name }}</option>
                </select>

                <span>You can toggle announcements individually per role. For now, if you choose to enable them, we will turn on promotion announcements for mastery roles.</span>
            </div>

            <div class="section" :class="!champion && 'dimmed'">
                <p>What language does your server speak?</p>

                <select v-model="language">
                    <option v-for="language in languages" :value="language.code">{{ language.name }}</option>
                </select>

                <span>What language do you want Orianna to respond in when someone uses a command? Member language preferences will be prioritized over the server language. Don't see your language? <a href="/translate/">Contribute a translation!</a></span>
            </div>

            <div class="section" :class="!champion && 'dimmed'">
                <p>When should we introduce ourselves?</p>

                <select v-model="engagementMode">
                    <option value="on_command">When a member first uses a command.</option>
                    <option value="on_join">When a member first joins the server.</option>
                    <option value="on_react" disabled>When a member reacts with a certain emote in a certain channel.</option>
                </select>

                <span>
                    Orianna will introduce herself to users and prompt them to add their accounts. By default, this happens when the user first interacts with Orianna (to prevent bothering people). If you intend to require your server members to register with Orianna, you can opt to change this setting to have Orianna message new users when they join the server.
                </span>

                <span>
                    You can also configure Orianna to message people when they react with an emote in a certain channel. Due to this option requiring a bit more configuration, you will need to do that after you finish the introduction.
                </span>
            </div>

            <div class="section finish" :class="!champion && 'dimmed'">
                <p>You're all set!</p>

                <span>You're ready to start using Orianna. Any of the settings you just configured can be changed whenever you want. For more info, visit the <router-link to="/docs">documentation</router-link>.</span>

                <button class="button" :disabled="!champion || finishing" @click="finish">{{ finishing ? 'Loading...' : 'Complete Setup' }}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import ChampionDropdown from "../champion-dropdown/champion-dropdown.vue";
    import { ServerDetails } from "../server/server";

    export default {
        components: { ChampionDropdown },
        data() {
            return {
                champion: null,
                createRegionRoles: true,
                createRankedRoles: false,
                createMasteryRoles: false,
                masteryRoleType: "levels",
                announceChannel: "null",
                channels: [],
                finishing: false,
                engagementMode: "on_command",
                language: "en-US",
                languages: [{ code: "en-US", name: "English" }]
            };
        },
        async mounted() {
            this.$root.get("/api/v1/server/" + this.$route.params.id).then((res: ServerDetails) => {
                this.channels = res.discord.channels;
            });

            this.languages = await this.$root.get("/api/v1/languages");
        },
        methods: {
            async finish() {
                if (!this.champion || this.finishing) return;
                this.finishing = true;

                const id = this.$route.params.id;

                // Mark as intro complete, announce and champion.
                await this.$root.submit(`/api/v1/server/${id}`, "PATCH", {
                    completed_intro: true,
                    language: this.language,
                    default_champion: +this.champion,
                    engagement: { type: this.engagementMode },
                    announcement_channel: this.announceChannel === "null" ? null : this.announceChannel
                });

                // Create region roles if needed.
                if (this.createRegionRoles) {
                    await this.$root.submit(`/api/v1/server/${id}/role/preset/region`, "POST", {});
                }

                // Create ranked roles if needed.
                if (this.createRankedRoles) {
                    await this.$root.submit(`/api/v1/server/${id}/role/preset/rank`, "POST", { queue: "HIGHEST" });
                }

                // Create mastery roles if needed.
                if (this.createMasteryRoles) {
                    if (this.masteryRoleType === "levels") {
                        await this.$root.submit(`/api/v1/server/${id}/role/preset/mastery`, "POST", { champion: this.champion });
                    } else if (this.masteryRoleType === "50k") {
                        await this.$root.submit(`/api/v1/server/${id}/role/preset/step`, "POST", {
                            champion: this.champion,
                            start: 50000,
                            end: 1000000,
                            step: 50000
                        });
                    } else if (this.masteryRoleType === "100k") {
                        await this.$root.submit(`/api/v1/server/${id}/role/preset/step`, "POST", {
                            champion: this.champion,
                            start: 100000,
                            end: 1000000,
                            step: 100000
                        });
                    } else if (this.masteryRoleType === "250k") {
                        await this.$root.submit(`/api/v1/server/${id}/role/preset/step`, "POST", {
                            champion: this.champion,
                            start: 250000,
                            end: 1000000,
                            step: 250000
                        });
                    }
                }

                // We're done, redirect to server page.
                this.$router.push("/server/" + id);
            }
        }
    };
</script>

<style lang="stylus" src="./intro-style.styl"></style>