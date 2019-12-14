#!/usr/bin/env node
const YAML = require("yaml");
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const { verifyLanguageFile, verifyAndRegisterLanguage, buildVariableMap } = require("./src");

// Run in a function so we can return early.
process.exit((() => {
    if (process.argv.length < 3) {
        console.error("Usage: build-translations [path to translations] ([output file path])");
        return 1;
    }

    const languageDir = process.argv[2];

    // First process english to get a "ground truth" that other languages should match.
    const english = YAML.parse(fs.readFileSync(path.join(languageDir, "./en.yaml"), "utf8"));
    const reference = buildVariableMap(path.join(languageDir, "./en.yaml"), english);
    if (!reference) return 1;

    // Now check and transform all languages (this also includes english).
    for (const filename of glob.sync(path.join(languageDir, "./*.yaml"))) {
        const language = YAML.parse(fs.readFileSync(filename, "utf8"));
        if (!verifyLanguageFile(filename, language)) return 1;

        const errors = verifyAndRegisterLanguage(reference, filename, language);

        if (errors.length) {
            for (const error of errors) {
                console.error(`[-] ERR: Key '${error.key}' in language '${language.metadata.name}' has an error: ${error.message}`);
            }

            return 1;
        }
    }

    // Write the result.
    const target = process.argv[3] || "./translations.json";
    fs.writeFileSync(target, JSON.stringify(reference.languageMap, null, 4));
    console.log(`[+] OK: Written translations to '${target}'. Do NOT commit this file into source control.`);
})());