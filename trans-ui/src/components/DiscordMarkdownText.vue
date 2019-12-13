<template>
    <span v-html="convertedMarkdown" />
</template>

<script lang="ts">
    import { Component, Prop, Vue } from "vue-property-decorator";
    import MarkdownIt from "markdown-it";

    const md = new MarkdownIt({
        html: true
    });

    @Component({})
    export default class DiscordMarkdownText extends Vue {
        @Prop()
        content!: string;

        @Prop({ default: true })
        replaceEmoji!: boolean;

        get convertedMarkdown() {
            // Replace mentions.
            let content = this.content.replace(/<@!?(\d+)>/g, () => {
                return `<span class="mention wrapperHover-1GktnT wrapper-3WhCwL" role="button">@User</span>`;
            });

            // Replace custom emotes.
            content = content.replace(/<a?:(\w+?):(\d+)>/g, (match, name, id) => {
                return `<img aria-label=":${name}:" src="https://cdn.discordapp.com/emojis/${id}.${match.startsWith("<a") ? "gif" : "png"}?v=1" alt=":${name}:" draggable="false" class="emoji">`;
            });

            // Replace twitter emojis.
            content = twemoji.parse(content.trim());

            return md.renderInline(content).replace(/<code>/g, "<code class='inline'>");
        }
    }
</script>