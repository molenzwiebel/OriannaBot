const { verifyLanguageFile, getVariables } = require("./utils");

/**
 * Builds a reference language variable map for other languages to be compared
 * against. Returns the language map and keys list, or null if the language is incorrectly formed.
 */
function buildVariableMap(filename, language) {
    if (!verifyLanguageFile(filename, language)) return null;

    // Collect translation keys.
    const keys = new Set(Object.keys(language));
    keys.delete("metadata");

    // Collect translation variables.
    const variables = new Map();
    for (const key of keys) {
        variables.set(key, getVariables(language[key]));
    }

    // Build the result map with the variables all configured.
    const result = {
        variables: {},
        languages: {}
    };

    for (const [key, value] of variables) {
        result.variables[key] = {};
        for (const v of value) {
            result.variables[key][v] = "";
        }
    }

    return {
        languageMap: result,
        keys,
        variables
    };
}

/**
 * Using the provided reference built by `buildVariableMap`, checks
 * if `language` is correctly formed. If it is, it is added to the
 * list of languages in the reference and an empty array is returned.
 *
 * This function assumes that the language is correctly formed.
 *
 * If any errors are found, they are returned in an array with the
 * key and the relevant error message.
 */
function verifyAndRegisterLanguage({ languageMap: reference, keys, variables }, filename, language) {
    const errors = [];
    if (!verifyLanguageFile(filename, language)) throw new Error("The language is incorrectly formed.");

    const newKeys = new Set(Object.keys(language));
    newKeys.delete("metadata");

    // Check missing keys.
    for (const key of keys) {
        if (!newKeys.has(key)) {
            errors.push({
                key,
                message: `Missing a translation for '${key}'.`
            });
        }
    }

    // Check extra keys.
    for (const key of newKeys) {
        if (!keys.has(key)) {
            errors.push({
                key,
                message: `Unused translation: '${key}'.`
            });
        }
    }

    // Check mismatched variables.
    for (const key of keys) {
        const referenceVars = variables.get(key);
        const languageVars = getVariables(language[key]);

        // Error if an extra var is used.
        for (const v of languageVars) {
            if (!referenceVars.has(v)) {
                errors.push({
                    key,
                    message: `Unknown variable: '${v}'.`
                });
            }
        }
    }

    if (!errors.length) {
        // This language is good.
        reference.languages[language.metadata.code] = {
            metadata: language.metadata,
            phrases: {
                ...language,
                metadata: void 0
            }
        };
    }

    return errors;
}

module.exports = {
    buildVariableMap,
    verifyAndRegisterLanguage
};