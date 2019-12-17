import Vue from "vue";
import YAML from "yaml";
import debounce from "lodash.debounce";
import { buildVariableMap, Language, LanguageMapReference, verifyAndRegisterLanguage } from "orianna-trans";

/**
 * This store contains both the reference language and the current values for the language.
 */
const store = Vue.observable({
    loading: true,
    loadingLanguage: false,

    // Language stuff
    languageMapReference: <LanguageMapReference | null>null,
    language: <Language | null>null,
    errors: <{ [key: string]: string }>{},

    // Static data stuff.
    ddragonVersion: "",
    ddragonData: <{ [key: string]: any }>{},

    /**
     * Loads the default english translations and sets them as the current translations.
     */
    async load(path: string) {
        this.loading = true;

        // Load reference language.
        const resp = await fetch(path).then(x => x.text());
        const language = YAML.parse(resp);

        this.languageMapReference = buildVariableMap(path, language);
        this.language = language;

        // Load static data.
        const versions = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(x => x.json());
        this.ddragonVersion = versions[0];
        await this.loadDDragonTranslation("en_US");

        this.loading = false;
    },

    /**
     * Only loads a language, assumes the reference is already loaded.
     */
    async loadLanguage(path: string) {
        this.loading = true;

        try {
            const resp = await fetch(path).then(x => x.text());
            this.language = YAML.parse(resp);
        } catch {
            alert("The language failed to parse as YAML. Is it a raw document and not a full page?");
        }

        this.loading = false;
    },

    /**
     * Loads the specified translation of ddragon in the background, unless it is already loaded.
     */
    async loadDDragonTranslation(language: string) {
        if (this.ddragonData[language] || !this.ddragonVersion) return;

        this.loadingLanguage = true;

        const data = await fetch(`https://ddragon.leagueoflegends.com/cdn/${this.ddragonVersion}/data/${language}/champion.json`).then(x => x.json());
        this.ddragonData[language] = data.data;

        this.loadingLanguage = false;
    },

    /**
     * Returns the name of the specified champion in the current ddragon language. Assumes
     * that the language has already been loaded.
     */
    getChampionTranslation(championKey: string) {
        return this.ddragonData[this.language!.metadata.ddragonLanguage][championKey].name;
    }
});

// Use dummy vue instance to observe changes.
const dummy = new Vue({
    data: { store },
    watch: {
        // Load translations for the specified ddragon data.
        ["store.language.metadata.ddragonLanguage"](newValue: string) {
            store.loadDDragonTranslation(newValue);
        },

        "store.language": {
            // Debounce this so we don't recompute errors on every keystroke.
            handler: debounce(function(this: any) {
                if (!this.store.languageMapReference || !this.store.language) return;

                const errors = verifyAndRegisterLanguage(this.store.languageMapReference!, "", this.store.language!);
                this.store.errors = {};

                for (const err of errors) {
                    this.store.errors[err.key] = err.message;
                }
            }, 300),
            deep: true
        }
    }
});

export default store;