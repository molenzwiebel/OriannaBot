/**
 * Verifies that a language file is correctly formed.
 * This only looks at the general structure, not at the contents.
 *
 * Returns true if the language is valid, false otherwise.
 */
function verifyLanguageFile(filename, language) {
    if (!language.metadata || typeof language.metadata !== "object") {
        console.error(`[-] ERR: Language '${filename}' is missing a metadata entry.`);
        return false;
    }

    if (typeof language.metadata.code !== "string" || typeof language.metadata.name !== "string" || typeof language.metadata.ddragonLanguage !== "string") {
        console.error(`[-] ERR: Language '${filename}' is missing 'metadata.code', 'metadata.name' and/or 'metadata.ddragonLanguage'.`);
        return false;
    }

    for (const key of Object.keys(language)) {
        if (key === "metadata") continue;

        if (typeof language[key] !== "string") {
            console.error(`[-] ERR: Translation entry '${key}' in ${language.metadata.name} should be a string.`);
            return false;
        }
    }

    return true;
}

/**
 * Returns the {variables} present in `phrase` as a set.
 */
function getVariables(phrase) {
    const vars = new Set();
    let result;

    const regex = /{(.*?)}/gi;
    while ((result = regex.exec(phrase))) {
        vars.add(result[1]);
    }

    return vars;
}

module.exports = {
    verifyLanguageFile,
    getVariables
};