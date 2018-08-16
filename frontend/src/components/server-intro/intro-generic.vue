<template>
    <div class="intro-specific">
        <div class="title">
            <p>Get started with Orianna Bot!</p>
            <span>Just a few more questions before you're done!</span>
        </div>

        <div class="sections">
            <div class="section">
                <p>Want to setup some role assignments?</p>

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
                </div>

                <span>We will optionally add some default role assignments for you. These are fully configurable and can be edited/removed at any time using the web interface.</span>
            </div>

            <div class="section finish">
                <p>You're all set!</p>

                <span>You're ready to start using Orianna. Any of the settings you just configured can be changed whenever you want. For more info, visit the <router-link to="/docs">documentation</router-link>.</span>

                <button class="button" :disabled="finishing" @click="finish">{{ finishing ? ' Loading... ' : 'Complete Setup' }}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        data() {
            return {
                finishing: false,
                createRegionRoles: true,
                createRankedRoles: false
            };
        },
        methods: {
            async finish() {
                if (this.finishing) return;
                this.finishing = true;

                const id = this.$route.params.id;

                // Mark as intro complete, announce and champion.
                await this.$root.submit(`/api/v1/server/${id}`, "PATCH", {
                    completed_intro: true
                });

                // Create region roles if needed.
                if (this.createRegionRoles) {
                    await this.$root.submit(`/api/v1/server/${id}/role/preset/region`, "POST", {});
                }

                // Create ranked roles if needed.
                if (this.createRankedRoles) {
                    await this.$root.submit(`/api/v1/server/${id}/role/preset/rank`, "POST", { queue: "HIGHEST" });
                }

                // We're done, redirect to server page.
                this.$router.push("/server/" + id);
            }
        }
    };
</script>

<style lang="stylus" src="./intro-style.styl"></style>