<template>
    <v-container class="translation-section">
        <div class="title">{{ section.title }}</div>
        <span>{{ section.description }}</span>

        <template v-for="keyGroup in section.keyGroups">
            <div class="aside">
                <div class="left">
                    <v-form>
                        <v-textarea
                                v-for="key in keyGroup.keys"
                                v-model="language[key]"
                                :label="key"
                                :hint="hintForKey(key)"
                                :error-messages="errorsForKey(key)"
                                auto-grow
                                rows="1"
                                @focus="highlight(key)"
                                @blur="removeHighlight(key)"
                                filled
                        />
                    </v-form>
                </div>

                <div class="right">
                    <div class="localized-embed" v-if="keyGroup.embed >= 0">
                        <div class="subtitle-2 blue-grey--text lighten-2">{{ section.embeds[keyGroup.embed].header }}</div>
                        <LocalizedEmbed :embed="section.embeds[keyGroup.embed]" />
                    </div>
                </div>
            </div>

            <v-divider />
        </template>
    </v-container>
</template>

<script lang="ts">
    import { Component, Vue, Prop } from "vue-property-decorator";
    import { TranslationSectionDefinition } from "@/types";
    import store from "@/store";
    import LocalizedEmbed from "@/components/LocalizedEmbed.vue";
    import { highlightClass, removeHighlight } from "@/highlighter";

    @Component({
        components: { LocalizedEmbed }
    })
    export default class TranslationSections extends Vue {
        @Prop()
        section!: TranslationSectionDefinition;

        get language() {
            return store.language!;
        }

        highlight(key: string) {
            highlightClass(key);
        }

        removeHighlight(key: string) {
            removeHighlight(key);
        }

        errorsForKey(key: string) {
            return store.errors[key] || [];
        }

        hintForKey(key: string) {
            const vars = store.languageMapReference!.languageMap.variables[key];
            if (!vars) return null;

            const keys = Object.keys(vars);
            if (!keys.length) return null;

            return "Variables: " + keys.join(", ");
        }
    }
</script>

<style lang="stylus">
    .translation-section
        .aside
            margin-top 10px
            display flex

        .v-textarea
            margin-top 10px

            input, textarea
                font-family monospace !important

        .left, .right
            flex 1

        .left
            margin-right 10px

        .right
            margin-left 10px

        .localized-embed
            margin-bottom 10px

            .subtitle-2
                margin-bottom 4px
</style>