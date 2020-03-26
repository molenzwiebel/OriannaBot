<template>
    <v-container class="metadata-settings">
        <div class="headline primary--text">Language Metadata</div>

        <span>This section discusses the metadata properties of your language. These include the name, language code and in-game language of your translation.</span>

        <v-form>
            <v-text-field v-model="metadata.name" label="Language Name"
                          hint="The name of your language, in your local tongue (for example Deutsch)."
                          persistent-hint/>
            <v-text-field v-model="metadata.code" label="Language Code" hint="The BCP 47 code for your language (en, fr, de, kr, etc...)."
                          persistent-hint/>
            <v-select v-model="metadata.ddragonLanguage" :items="ddragonLanguages" label="Static Data Language"
                            hint="The language that should be used for champion names." persistent-hint/>
        </v-form>
    </v-container>
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import store from "@/store";

    @Component({})
    export default class MetadataSettings extends Vue {
        get metadata() {
            return store.language!.metadata;
        }

        get ddragonLanguages() {
            return [{ "text": "Czech (Czech Republic)", "value": "cs_CZ" }, {
                "text": "Greek (Greece)",
                "value": "el_GR"
            }, { "text": "Polish (Poland)", "value": "pl_PL" }, {
                "text": "Romanian (Romania)",
                "value": "ro_RO"
            }, { "text": "Hungarian (Hungary)", "value": "hu_HU" }, {
                "text": "English (United Kingdom)",
                "value": "en_GB"
            }, { "text": "German (Germany)", "value": "de_DE" }, {
                "text": "Spanish (Spain)",
                "value": "es_ES"
            }, { "text": "Italian (Italy)", "value": "it_IT" }, {
                "text": "French (France)",
                "value": "fr_FR"
            }, { "text": "Japanese (Japan)", "value": "ja_JP" }, {
                "text": "Korean (Korea)",
                "value": "ko_KR"
            }, { "text": "Spanish (Mexico)", "value": "es_MX" }, {
                "text": "Spanish (Argentina)",
                "value": "es_AR"
            }, { "text": "Portuguese (Brazil)", "value": "pt_BR" }, {
                "text": "English (United States)",
                "value": "en_US"
            }, { "text": "English (Australia)", "value": "en_AU" }, {
                "text": "Russian (Russia)",
                "value": "ru_RU"
            }, { "text": "Turkish (Turkey)", "value": "tr_TR" },
            { "text": "English (Republic of the Philippines)", "value": "en_PH" }, {
                "text": "English (Singapore)",
                "value": "en_SG"
            }, { "text": "Thai (Thailand)", "value": "th_TH" }, {
                "text": "Vietnamese (Viet Nam)",
                "value": "vn_VN"
            }, { "text": "Indonesian (Indonesia)", "value": "id_ID" }, {
                "text": "Chinese (Malaysia)",
                "value": "zh_MY"
            }, { "text": "Chinese (China)", "value": "zh_CN" }, { "text": "Chinese (Taiwan)", "value": "zh_TW" }];
        }
    }
</script>

<style lang="stylus">
    .metadata-settings
        .v-text-field, .v-select
            margin-top 12px
</style>
