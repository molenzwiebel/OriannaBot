const YAML = require("yaml");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

// Verifies that a language file is correctly formed.
// This only looks at the general structure, not at the contents.
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

// Returns the {variables} present in `phrase` as a set.
function getVariables(phrase) {
    const vars = new Set();
    let result;

    const regex = /{(.*?)}/gi;
    while ((result = regex.exec(phrase))) {
        vars.add(result[1]);
    }

    return vars;
}

// Run in a function so we can return early.
process.exit((() => {
    // First process english to get a "ground truth" that other languages should match.
    const english = YAML.parse(fs.readFileSync(path.join(__dirname, "./en.yaml"), "utf8"));
    if (!verifyLanguageFile(path.join(__dirname, "./en.yaml"), english)) return 1;

    // Collect translation keys.
    const keys = new Set(Object.keys(english));
    keys.delete("metadata");

    // Collect translation variables.
    const variables = new Map();
    for (const key of keys) {
        variables.set(key, getVariables(english[key]));
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

    // Now check and transform all languages (this also includes english).
    for (const filename of glob.sync(path.join(__dirname, "./*.yaml"))) {
        const language = YAML.parse(fs.readFileSync(filename, "utf8"));
        if (!verifyLanguageFile(filename, language)) return 1;

        const newKeys = new Set(Object.keys(language));
        newKeys.delete("metadata");

        // Check missing keys.
        for (const key of keys) {
            if (!newKeys.has(key)) {
                console.error(`[-] ERR: Language ${language.metadata.name} is missing a translation for '${key}'.`);
                return 1;
            }
        }

        // Check extra keys.
        for (const key of newKeys) {
            if (!keys.has(key)) {
                console.error(`[-] ERR: Language ${language.metadata.name} has an unused translation: '${key}'.`);
                return 1;
            }
        }

        // Check mismatched variables.
        for (const key of keys) {
            const referenceVars = variables.get(key);
            const languageVars = getVariables(language[key]);

            // Warn if a variable is not used (this can happen).
            for (const v of referenceVars) {
                if (!languageVars.has(v)) {
                    console.log(`[~] WARN: Language ${language.metadata.name} does not use variable '${v}' in the translation for '${key}'. This is likely a bug.`);
                }
            }

            // Error if an extra var is used.
            for (const v of languageVars) {
                if (!referenceVars.has(v)) {
                    console.error(`[-] ERR: Language ${language.metadata.name} names a variable '${v}' in the translation for '${key}' that does not exist.`);
                    return 1;
                }
            }
        }

        // This language is good.
        result.languages[language.metadata.code] = {
            metadata: language.metadata,
            phrases: {
                ...language,
                metadata: void 0
            }
        };
    }

    // Write the result.
    fs.writeFileSync(process.argv[2] || "./translations.json", JSON.stringify(result, null, 4));
    console.log("[+] OK: Written translations to './translations.json'. Do NOT commit this file into source control.");
})());