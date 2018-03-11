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

        <div class="divider section"></div>

        <router-link v-if="!user" to="/sign-in" class="discord-sign-in">
            Sign In With
            <img src="https://discordapp.com/assets/e4923594e694a21542a489471ecffa50.svg">
        </router-link>

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
    </div>
</template>

<script>
    export default {
        props: ["user"]
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
</style>