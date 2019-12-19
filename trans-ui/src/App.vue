<template>
    <v-app id="inspire">
        <v-app-bar app clipped-left>
            <v-toolbar-title>Orianna Bot - Translation Tool</v-toolbar-title>
        </v-app-bar>

        <v-content :class="loading && 'loading-container'">
            <v-progress-circular indeterminate v-if="loading" />

            <template v-else>
                <v-container>
                    <div class="display-1 primary--text">Orianna Translation Tool</div>
                    <span>
                        This site is an interactive tool to create translation files for <a href="https://orianna.molenzwiebel.xyz">Orianna Bot</a>. Start by loading an existing translation (such as English) using the import/export options below.
                        Then, translate the fields using the previews on the right as a guide. Once you're done, head back to the import/export options to download your language file.

                        <br><br>

                        Once you've completed your translation (or if you want to make changes to an existing language), join the <a href="https://discord.gg/bfxdsRC">Orianna Discord Server</a> and send a message to molenzwiebel. You can also join
                        the server if you are having trouble with something or have a question in general.

                        <br><br>

                        The default English translation has already been loaded for you. You can opt to load a different translation in the save/load options, such as a different language or a work-in-progress language. You can also use the buttons
                        there to save and load the current translation from/to a `.yaml` file. This yaml file is also the language that you will need to submit in the code repository.

                        <br><br>

                        As some general translation pointers, try to keep the general tone of the English message where possible. Do not blindly translate though, try to convey the same meaning in a way that your language would normally do it. To
                        stay consistent with the English translation, refer to Orianna as a "she"/"me" unless your language has something more appropriate. For situations where the current translation tools are not capable of always being gramatically
                        correct (such as order of words changing based on a gender), prefer the solution that works "most of the time". If there's no such solution, please send <code>@molenzwiebel#2773</code> a message on Discord and we can figure out
                        a way around it.
                    </span>
                </v-container>

                <LoadExportSettings />
                <MetadataSettings />

                <v-divider />

                <TranslationSections />
            </template>
        </v-content>
    </v-app>
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import LoadExportSettings from "@/components/LoadExportSettings.vue";
    import MetadataSettings from "@/components/MetadataSettings.vue";
    import TranslationSections from "@/components/TranslationSections.vue";
    import store from "@/store";

    @Component({
        components: { LoadExportSettings, MetadataSettings, TranslationSections }
    })
    export default class App extends Vue {
        mounted() {
            this.$vuetify.theme.dark = true;
            store.load("https://raw.githubusercontent.com/molenzwiebel/OriannaBot/master/trans/languages/en.yaml");
        }

        get loading() {
            return store.loading;
        }
    }
</script>

<style lang="stylus">
    html
        overflow hidden !important

    body
        overflow-y scroll !important

    .loading-container
        display flex
        align-items center
        justify-content center

        .v-content__wrap
            display flex
            justify-content center
</style>
