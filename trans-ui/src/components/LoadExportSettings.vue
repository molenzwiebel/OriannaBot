<template>
    <v-container class="load-export-settings">
        <div class="headline primary--text">Load/Export Language</div>

        <div>Import an existing translation or export your current translation here.</div>

        <div class="subtitle-1 font-weight-bold">Start From Scratch</div>
        <div>This will start you off with a completely empty translation. This is not recommended, since the reference examples will be empty. Consider starting with English instead.</div>
        <v-btn text @click="startScratch" outlined>Start From Scratch</v-btn>

        <div class="subtitle-1 font-weight-bold">Start From English</div>
        <div>This will load the default English translation. Note that we've already loaded it for you when you first loaded this page.</div>
        <v-btn text @click="startEnglish" outlined>Start From English</v-btn>

        <div class="subtitle-1 font-weight-bold">Load From URL (Github, Etc) <small>Note: this must be a raw document.</small></div>
        <v-text-field v-model="url" label="URL" filled prepend-icon="mdi-link">
            <template slot="append-outer">
                <v-btn text @click="loadFromURL" outlined>Load</v-btn>
            </template>
        </v-text-field>

        <div class="subtitle-1 font-weight-bold">Load From Local File</div>
        <div>Load a translation you saved earlier.</div>
        <v-file-input label="Translation .yaml" accept=".yaml,.yml" filled @change="handleUpload" />

        <div class="subtitle-1 font-weight-bold">Save To Local File</div>
        <div>This will save the current translation to a .yaml file that you can later load or submit as a translation.</div>
        <div v-if="hasErrors" class="errors">Warning: You have several errors. Consider fixing them.</div>
        <v-btn text @click="downloadFile" outlined>Download As File</v-btn>
    </v-container>
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import YAML from "yaml";
    import store from "@/store";

    // Make sure people don't lose their progress.
    window.onbeforeunload = () => {
        return "Are you sure you want to leave? Any unsaved translations will be lost. Use the 'Export To YAML' button to save your changes to a local file.";
    };

    @Component({})
    export default class LoadExportSettings extends Vue {
        private url = "";

        get hasErrors() {
            return Object.keys(store.errors).length > 0;
        }

        startScratch() {
            store.language = <any>{
                metadata: {
                    name: "My Language",
                    code: "en",
                    ddragonLanguage: "en_US"
                }
            };
        }

        startEnglish() {
            store.loadLanguage("https://raw.githubusercontent.com/molenzwiebel/OriannaBot/master/trans/languages/en.yaml");
        }

        async loadFromURL() {
            if (!this.url) return;

            await store.loadLanguage(this.url);

            this.url = "";
        }

        async handleUpload(file: File) {
            if (!(file instanceof File)) return;

            const reader = new FileReader();
            reader.readAsText(file);

            try {
                const result = await new Promise<string>((resolve, reject) => {
                    reader.onload = (evt: any) => {
                        if (!evt.target || evt.target.readyState !== 2) return;
                        if (evt.target.error) {
                            return reject();
                        }

                        resolve(evt.target.result);
                    };
                });

                store.language = YAML.parse(result);

                alert("Language loaded.");
            } catch {
                alert("There was an error reading that file.");
            }
        }

        async downloadFile() {
            const contents = YAML.stringify(store.language);

            const objectURL = URL.createObjectURL(new Blob([contents], {
                type: "text/plain;charset=utf-8;"
            }));

            const a = document.createElement("a");
            a.download = store.language!.metadata.code + ".yaml";
            a.href = objectURL;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
</script>

<style lang="stylus">
    .load-export-settings
        .title + div
            margin 10px 0

        .subtitle-1
            margin-top 10px

        .v-text-field, .v-select
            margin-top 12px

        .errors
            color red

        .aside
            display flex
            align-items center
            justify-content center
</style>