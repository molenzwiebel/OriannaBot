<template>
    <div class="translation-sections">
        <v-container>
            <div class="headline primary--text">Translations</div>
        </v-container>

        <TranslationSection :key="section.name" v-for="section in sections" :section="section" />
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import TranslationSection from "@/components/TranslationSection.vue";
    import { TranslationSectionDefinition } from "@/types";
    import sections from "@/sections";

    @Component({
        components: {
            TranslationSection
        }
    })
    export default class TranslationSections extends Vue {
        get sections(): TranslationSectionDefinition[] {
            return sections;
        }
    }
</script>