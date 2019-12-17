<template>
    <div>
        <Embed :embed="discordEmbed" />
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from "vue-property-decorator";
    import { DiscordEmbedObject, LocalizedEmbedObject, LocalizedString } from "@/types";
    import Embed from "@/components/Embed.vue";
    import store from "@/store";
    import { highlightClass } from "@/highlighter";

    @Component({
        components: { Embed }
    })
    export default class LocalizedEmbed extends Vue {
        @Prop()
        embed!: LocalizedEmbedObject;

        highlight() {
            highlightClass("ranked_tier_challenger");
        }

        get store() {
            return store;
        }

        get discordEmbed() {
            const ret: Partial<DiscordEmbedObject> = {
                color: this.embed.color,
                timestamp: this.embed.timestamp,
                thumbnail: this.embed.thumbnail,
                image: this.embed.image
            };

            if (this.embed.title) {
                ret.title = convertLocalizedString(this.embed.title);
            }

            if (this.embed.description) {
                ret.description = convertLocalizedString(this.embed.description);
            }

            if (this.embed.author) {
                ret.author = {
                    name: convertLocalizedString(this.embed.author.name),
                    icon_url: this.embed.author.icon_url
                };
            }

            for (const field of this.embed.fields || []) {
                (ret.fields || (ret.fields = [])).push({
                    name: convertLocalizedString(field.name),
                    value: convertLocalizedString(field.value),
                    inline: field.inline
                });
            }

            if (this.embed.footer) {
                ret.footer = {
                    text: this.embed.footer.text ? convertLocalizedString(this.embed.footer.text) : void 0,
                    icon_url: this.embed.footer.icon_url
                };
            }

            return ret;
        }
    }

    // Need this useless function or typescript yells at me.
    function isChampionNode(str: LocalizedString[0]): str is { champion: string } {
        return typeof (<any>str).champion !== "undefined";
    }

    function convertLocalizedString(localizedString: LocalizedString): string {
        let ret = "";

        for (const element of localizedString) {
            if (typeof element === "string") {
                ret += element;
            } else if (isChampionNode(element)) {
                ret += store.loadingLanguage ? "" : store.getChampionTranslation(element.champion);
            } else {
                let translation = `<span class="translation ${element.name}">` + (store.language![element.name] || `{{ ${element.name} }}`);
                if (element.args) {
                    for (const [k, v] of Object.entries(element.args)) {
                        let value = v.toString();
                        if (typeof v === "number") {
                            value = v.toLocaleString(store.language!.metadata.code);
                        }

                        if (typeof v === "object") {
                            value = convertLocalizedString(v);
                        }

                        translation = translation.replace(new RegExp("{" + k + "}", "g"), value);
                    }
                }
                ret += translation + `</span>`;
            }
        }

        return ret;
    }
</script>