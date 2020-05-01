<template>
    <div class="sidebar">
        <router-link to="/" class="home-logo" exact active-class="ignore">
            ORIANNA
        </router-link>

        <div class="divider section"></div>

        <router-link to="/docs">
            <i class="icon ion-ios-book-outline"></i>
            Documentation
        </router-link>

        <div class="divider"></div>

        <a href="https://github.com/molenzwiebel/oriannabot">
            <i class="icon ion-social-github"></i>
            Source Code
        </a>

        <div class="divider"></div>

        <router-link to="/invite">
            <i class="icon ion-at"></i>
            Invite Orianna Bot
        </router-link>

        <div class="divider"></div>

        <a href="https://discord.gg/bfxdsRC">
            <i class="icon ion-android-chat"></i>
            Support Server
        </a>

        <div class="divider section"></div>

        <a v-if="!user" :href="signInLink" class="discord-sign-in">
            Sign In With
            <img src="https://discordapp.com/assets/e4923594e694a21542a489471ecffa50.svg">
        </a>

        <template v-if="user">
            <router-link to="/me">
                <img class="avatar" :src="user.avatar">
                {{ user.username }}
            </router-link>

            <div class="divider section"></div>

            <router-link v-for="guild in user.guilds" :to="'/server/' + guild.id" :key="guild.id">
                <img class="avatar" :src="guild.icon">
                {{ guild.name }}
            </router-link>
        </template>

        <div class="gutter"></div>

        <div class="divider"></div>

        <div class="about">
            <span>
                Orianna <a :href="gitCommitUrl">v{{ gitCommit }}</a>
            </span>
            <span>
                <span style="border-bottom: 1px dashed lightgray" title="Orianna Bot isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc." v-tippy="{ 'arrow': true, animation: 'shift-away' }">Legal</span>
                - <router-link to="/privacy">Privacy</router-link>
            </span>
            <span>Made with <span style="color: red">♥</span> by molenzwiebel</span>
        </div>
    </div>
</template>

<script lang="ts">
    import { API_HOST } from "../../config";

    export default {
        props: ["user"],
        computed: {
            signInLink() {
                return API_HOST + "/api/v1/discord";
            },
            gitCommitUrl() {
                return "https://github.com/molenzwiebel/OriannaBot/commit/" + GIT_COMMITHASH;
            },
            gitCommit() {
                return GIT_COMMITHASH.substr(0, 7);
            },
            gitBranch() {
                return GIT_BRANCH;
            }
        }
    };
</script>

<style lang="stylus">
    navbar-width = 240px
    navbar-background = white
    navbar-text-color = black
    navbar-selected-color = #3380e5

    .sidebar
        width navbar-width
        background-color navbar-background
        position fixed
        left 0
        top 0
        height 100%

        display flex
        flex-direction column
        border-right 1px solid #e5e5e5

        & > a
            padding 10px 10px 10px 15px
            transition 0.2s ease
            text-decoration none
            position relative
            font-family Roboto
            font-size 20px
            display flex
            align-items center
            color navbar-text-color

            & > .icon
                width 24px

            & > img.avatar
                width 20px
                height 20px
                border-radius 50%
                display inline-block
                margin-right 5px

            &:hover
                background-color darken(navbar-background, 5%)
                color navbar-selected-color

            &.router-link-active
                color navbar-selected-color

            &:before
                content ''
                position absolute
                left 0
                top 0
                height 100%
                width 4px
                transition 0.2s ease

            &.router-link-active:before
                background-color navbar-selected-color

        & > .home-logo
            padding-top 15px
            font-family Mina
            align-self center
            letter-spacing 0.5px
            font-size 30px

        & > .discord-sign-in
            padding-top 30px
            text-align center
            font-size 16px
            text-transform uppercase
            color #898989
            display flex
            flex-direction column

            & > img
                width 160px

        & > .divider
            width navbar-width
            height 1px
            background-color #eaeaea

            &.section
                background-color #257fca
                opacity 0.6

        & > .gutter
            flex 1

        & > .about
            font-family Roboto
            display flex
            align-items center
            flex-direction column
            padding 10px
            font-size 14px
            text-transform uppercase
            color #717171

            span
                margin-top 2px

            span[title]
                cursor pointer

            a
                color #515151

    @media only screen and (max-width: 780px)
        .sidebar
            position fixed
            left 0
            top 43px
            right 0

        .home-logo
            display none !important

    .tippy-popper
        font-family Roboto
</style>