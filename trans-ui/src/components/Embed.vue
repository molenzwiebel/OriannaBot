<template>
    <div class="theme-dark">
        <div class="embedWrapper-3AbfJJ embedFull-2tM8-- embed-IeVjo6 markup-2BOw-j" :style="pillColor">
            <div class="grid-1nZz7S">
                <!-- Title. -->
                <div class="embedTitle-3OXDkz embedMargin-UO5XwE" v-if="embed.title">
                    <DiscordMarkdownText :content="embed.title" />
                </div>

                <!-- Author -->
                <div class="embedAuthor-3l5luH embedMargin-UO5XwE" v-if="embed.author">
                    <img class="embedAuthorIcon--1zR3L" :src="embed.author.icon_url" v-if="embed.author.icon_url">
                    <span class="embedAuthorName-3mnTWj"><DiscordMarkdownText :content="embed.author.name" /></span>
                </div>

                <!-- Description. -->
                <div class="embedDescription-1Cuq9a embedMargin-UO5XwE" v-if="embed.description">
                    <DiscordMarkdownText :content="embed.description" />
                </div>

                <!-- Fields. -->
                <div class="embedFields-2IPs5Z" v-if="fieldsWithSizes.length">
                    <div class="embedField-1v-Pnh" :style="field.gridSize" v-for="field in fieldsWithSizes">
                        <div class="embedFieldName-NFrena"><DiscordMarkdownText :content="field.name" /></div>
                        <div class="embedFieldValue-nELq2s"><DiscordMarkdownText :content="field.value" /></div>
                    </div>
                </div>

                <!-- Image. -->
                <a class="anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedWrapper-3AbfJJ embedMedia-1guQoW embedImage-2W1cML" :href="embed.image.url" rel="noreferrer noopener" target="_blank" role="button" :style="`width: ${embed.image.width}px; height: ${embed.image.height}px;`" v-if="embed.image">
                    <img :src="embed.image.url" :style="`width: ${embed.image.width}px; height: ${embed.image.height}px;`">
                </a>

                <!-- Thumbnail -->
                <a class="anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB imageWrapper-2p5ogY imageZoom-1n-ADA clickable-3Ya1ho embedThumbnail-2Y84-K" rel="noreferrer noopener" target="_blank" role="button" style="width: 80px; height: 80px;" v-if="embed.thumbnail">
                    <img :src="embed.thumbnail.url" style="width: 80px; height: 80px;">
                </a>

                <!-- Footer -->
                <div class="embedFooter-3yVop- embedMargin-UO5XwE" v-if="embed.footer">
                    <img class="embedFooterIcon-239O1f" :src="embed.footer.icon_url" v-if="embed.footer.icon_url">
                    <span class="embedFooterText-28V_Wb" v-if="embed.footer.text">
                        <span v-html="embed.footer.text" />
                        <template v-if="embed.timestamp">
                            <span class="embedFooterSeparator-3klTIQ">•</span>
                            Today at 13:37
                        </template>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from "vue-property-decorator";
    import DiscordMarkdownText from "@/components/DiscordMarkdownText.vue";
    import { DiscordEmbedObject, DiscordField } from "@/types";

    @Component({
        components: { DiscordMarkdownText }
    })
    export default class Embed extends Vue {
        @Prop()
        embed!: DiscordEmbedObject;

        get pillColor() {
            const r = (this.embed.color >> 16) & 0xFF;
            const g = (this.embed.color >>  8) & 0xFF;
            const b = (this.embed.color >>  0) & 0xFF;

            return `border-color: rgb(${r}, ${g}, ${b})`;
        }

        get fieldsWithSizes() {
            const groups = [];
            let currentGroup: DiscordField[] = [];

            // Group fields into lines.
            for (const field of this.embed.fields || []) {
                if (!field.inline || currentGroup.length === 3) {
                    if (currentGroup.length) {
                        groups.push(currentGroup);
                        currentGroup = [];
                    }
                }

                currentGroup.push(field);

                if (!field.inline) {
                    groups.push(currentGroup);
                    currentGroup = [];
                }
            }

            if (currentGroup.length) {
                groups.push(currentGroup);
            }

            const ret: (DiscordField & { gridSize: string })[] = [];

            // Figure out the size for each field.
            for (const group of groups) {
                const step = group.length === 1 ? 12 : group.length === 2 ? 7 : 4;
                let start = 1;

                for (const field of group) {
                    ret.push({
                        ...field,
                        gridSize: `grid-column: ${start} / ${start + step};`
                    });

                    start += step;
                }
            }

            return ret;
        }
    }
</script>

<style lang="stylus">
    // Remove vuetify styles
    .embedFull-2tM8-- code
        background-color var(--background-tertiary) !important
        color var(--text-normal) !important
        box-shadow none
</style>