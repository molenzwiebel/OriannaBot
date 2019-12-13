<template>
    <Embed :embed="embed" />
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import Embed from "@/components/Embed.vue";
    import DiscordMarkdownText from "@/components/DiscordMarkdownText.vue";

    const EMBED = {
        "title": ":newspaper: Orianna Bot Updates!",
        "description": "\n\nHey there! I'm molenzwiebel, the creator of Orianna Bot. Since there are a few things going on at the same time related to Orianna Bot, I'm sending around a \"newsletter\" of sorts to bigger servers that routinely use Orianna (200+ members, 5+ roles configured). This server is one of them. As per the disclaimer on the top, I've tried to send this message in staff channels where possible. Sorry if this message ended up in a weird place.\n\nWithout further ado, let's get to the actual news!",
        "color": 0x0a96de,
        "footer": {
            "text": "Orianna Bot \"Newsletter\". Thanks for reading!"
        },
        "thumbnail": {
            "url": "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png"
        },
        "fields": [
            {
                "name": ":wave: **New Option: 'Engagement Mode'**",
                "value": "There's a new option on the Orianna dashboard called **Engagement Mode**. This option describes how Orianna will introduce herself to new members on your server. Currently, Orianna will send an introductory message to anyone when they first use an Orianna Bot command. This is the default value for the engagement mode.\n\nHowever, this option often leads to introduction channels and setup flows where you have to tell users to \"use @ori edit to get your roles\". Not exactly the best user experience. That is why this option is now configurable and has two other values!"
            },
            {
                "name": "\u200b",
                "value": "The first (and default) option is to **message on the user's first command**. The second option is to have Orianna message users **when they join the server**. These options should be fairly straightforward. The third option is a bit more interesting: Orianna will message people **when they react with a specific emote in a specific channel**. This option allows you to create a rules/introduction channel where users can click a single react to get started with Orianna! No more telling people that they need to use a command!\n\nFor more info about the new option, and to change the value for your server, head to the [Orianna control panel](https://orianna.molenzwiebel.xyz) and select your server from the sidebar."
            },
            {
                "name": ":globe_with_meridians: **Orianna Goes International!**",
                "value": "After receiving this request one too many times, I've started work on adding translation support to Orianna. Both servers and users will be able to set a preferred language and Orianna will intelligently translate her responses based on these settings.\n\nI'd initially like to support at least some of the languages in which League is officially available. These languages include ([among others](https://developer.riotgames.com/docs/lol#data-dragon_languages)) Spanish, German, Polish, Korean, Turkish and Portuguese.\n\nIf you are a server staff member that runs a non-english server and would like to help translate Orianna, please reach out! All help is appreciated! To get an idea of how much translation work is needed, check out [the English language file](https://github.com/molenzwiebel/OriannaBot/blob/master/trans/en.yaml). If you'd still like to help, join the [Orianna discord](https://discord.gg/bfxdsRC) and send me a ping or DM!"
            },
            {
                "name": ":tada: **10,000 Servers!**",
                "value": "And I'd like to thank each of them! Orianna will soon (within days) reach 10k servers and I never expected she would get so big. This is a heartfelt thanks to everyone that uses Orianna and enjoys using something I created. If you're in a hugging mood, come join the [Orianna discord](https://discord.gg/bfxdsRC) so I can send you a virtual hug."
            },
            {
                "name": ":heart: **And The Rest**",
                "value": "Please let me know what you think of a \"newsletter\" such as this one! I'd like to know if people appreciate them, or if its more of an email that you never signed up for. If there's a positive response, I'll consider sending out messages every once in a while (1-2 a year) with updates and new features.\n\nSpeaking about features, do you have ideas for features? Let me know, or [implement them yourself](https://github.com/molenzwiebel/oriannabot)! Orianna is open source after all.\n\nTo contact me and give feedback, or to say hi, or to play a game of League with me, or to yell at Riot together, or all of the above, join the [Orianna discord](https://discord.gg/bfxdsRC)! If you're short on space, or if you dislike my constant shilling, you can also send a friend request to `@molenzwiebel#2773`."
            }
        ]
    };

    @Component({
        components: { DiscordMarkdownText, Embed }
    })
    export default class App extends Vue {
        get embed() {
            return EMBED;
        }
    }
</script>

<style lang="stylus">
    #app
        font-family "Avenir", Helvetica, Arial, sans-serif
        -webkit-font-smoothing antialiased
        -moz-osx-font-smoothing grayscale
        text-align center
        color #2c3e50
        margin-top 60px
</style>
