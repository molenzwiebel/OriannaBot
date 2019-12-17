import Vue from "vue";
import YAML from "yaml";
import { buildVariableMap, Language, LanguageMapReference } from "orianna-trans";

/**
 * This store contains both the reference language and the current values for the language.
 */
const store = Vue.observable({
    loading: false,
    languageMapReference: <LanguageMapReference | null>null,
    language: <Language | null>null,

    /**
     * Loads the default english translations and sets them as the current translations.
     */
    async load(path: string) {
        if (this.loading) return;

        this.loading = true;

        const resp = await fetch(path).then(x => x.text());
        const language = YAML.parse(resp);

        this.languageMapReference = buildVariableMap(path, language);
        this.language = language;

        this.loading = false;
    }
});

export default store;