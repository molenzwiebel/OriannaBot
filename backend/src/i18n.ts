import * as translations from "./translations.json";
import StaticData from "./riot/static-data";

/**
 * Represents the function arguments to a translation that takes arguments.
 */
type TranslationFunctionArgs<T extends object> = {
    [K in keyof T]: string | number;
};

/**
 * Helper for the type of the translator body. If the specified translation takes no arguments,
 * a string is returned. Else, a function that takes arguments is returned.
 */
type TranslatorEntry<T extends object> = {} extends T ? string : (args: TranslationFunctionArgs<T>) => string;

/**
 * Represents an object that type-safely translates. Translations are direct properties
 * if they do not take arguments, or else functions that take an object with params. Numbers
 * are directly formatted before they are inserted into the string,
 */
export type Translator = {
    [K in keyof typeof translations.variables]: TranslatorEntry<(typeof translations.variables)[K]>;
} & {
    /**
     * Format the specified number according to the rules of the language. If num decimals is specified,
     * the number will be truncated to the specified digits, else it will be rounded.
     */
    number: (num: number, numDecimals?: number) => string;

    /**
     * A static data instance that uses the relevant translated DDragon for this language.
     */
    staticData: StaticData;
};

/**
 * Function that builds a translator for the specified language entry.
 */
function buildTranslator(language: {
    metadata: { code: string, ddragonLanguage: string },
    phrases: { [key: string]: string }
}): Translator {
    const ret: any = {
        number: (num: number, numDecimals = 0) => num.toLocaleString(language.metadata.code, {
            minimumFractionDigits: numDecimals,
            maximumFractionDigits: numDecimals
        }),
        staticData: new StaticData(language.metadata.ddragonLanguage)
    };

    for (const [key, phrase] of Object.entries(language.phrases)) {
        const vars = (<{ [key: string]: object }>translations.variables)[key];

        if (Object.keys(vars).length === 0) {
            // If there are no vars, return a string.
            ret[key] = phrase;
        } else {
            // Else, return a function.
            ret[key] = (args: object) => {
                let str = phrase;

                for (const [k, v] of Object.entries(args)) {
                    // Convert to string if needed.
                    const value = typeof v === "number" ? ret.number(v) : v.toString();
                    str = str.replace(new RegExp("{" + k + "}", "g"), value);
                }

                return str;
            };
        }
    }

    return ret;
}

// Build a map of translators.
const translators = new Map(Object.values(translations.languages).map(x => [x.metadata.code, buildTranslator(x)]));

/**
 * Returns the metadata for all registered languages.
 */
export function getLanguages() {
    return Object.values(translations.languages).map(x => x.metadata);
}

/**
 * Returns the translator for the specified language code, or en_US if none match.
 */
export default function getTranslator(code: string): Translator {
    return translators.get(code) || translators.get("en-US")!;
}