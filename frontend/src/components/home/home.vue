<template>
    <div class="home">
        <video
                v-show="animatedLoaded"
                ref="vid"
                loop
                muted
                src="../../static/home-bg.webm"
                class="center">
        </video>

        <transition name="fade">
            <img
                    v-show="!animatedLoaded"
                    src="../../static/home-bg.jpg"
                    class="center">
        </transition>

        <div class="center darken"></div>

        <div class="home-content">
            <div class="top">
                <div class="hero-wrapper">
                    <span v-for="(l, i) in headlines" :class="headlineIndex === i ? 'is-visible' : shownOnce[i] ? 'is-hidden' : ''" class="hero">{{ l }}</span>
                </div>

                <span>A bot for all things mastery, roles and League. Track stats, receive roles, view leaderboards and more.</span>
            </div>

            <div class="bottom">
                <div class="discord" @click="$router.push('invite')">
                    <div class="discord-logo"></div>
                    Add to Discord
                </div>

                <div class="documentation" @click="$router.push('docs')">
                    Learn More
                </div>
            </div>
        </div>

        <div class="footer">
            Made with <span style="color: red" class="ion-heart"></span> by molenzwiebel &middot; Orianna Bot is not affiliated with Riot Games.
        </div>
    </div>
</template>

<script lang="ts">
    const headlines = [
        "Flex Your Mastery.",
        "Assign Your Roles.",
        "Track Your Progress.",
        "Battle Your Friends.",
        "Organize Your Members.",
        "Share Your Skills.",
        "Announce Your Promotions."
    ];

    export default {
        data() {
            return {
                animatedLoaded: false,
                headlines,
                shownOnce: {},
                headlineIndex: Math.floor(Math.random() * headlines.length)
            };
        },
        mounted() {
            // Change headlines.
            setInterval(() => {
                this.shownOnce[this.headlineIndex] = true;
                this.headlineIndex = (this.headlineIndex + 1) % headlines.length;
            }, 3500);

            // Wait for the video to load, then switch to the video.
            this.$refs.vid.addEventListener("canplay", () => {
                this.animatedLoaded = true;
                this.$refs.vid.defaultPlaybackRate = 0.5;
                this.$refs.vid.playbackRate = 0.5;
                this.$refs.vid.play();
            });
        }
    };
</script>

<style lang="stylus" scoped>
    .home
        display flex
        align-items center
        justify-content center
        width 100%
        height 100%

    .center
        position absolute
        top 0
        left 0
        width 100vw
        height 100vh
        object-fit cover

    .top
        display flex
        flex-direction column
        align-items center

        & > span
            color white
            padding-top 70px
            font-size 20px
            width 560px
            text-align center
            font-family Roboto

    .hero-wrapper
        perspective 300px
        width 700px
        text-align center
        display inline-block
        position relative

        .hero
            opacity 0
            transform-origin 50% 100%
            transform rotateX(180deg)
            position absolute
            left 0
            top 0
            width 100%
            color white
            font-family Roboto
            font-size 40px
            letter-spacing 1.2px

            &.is-visible
                opacity 1
                transform rotateX(0deg)
                animation rotate-in 1.2s

            &.is-hidden
                transform rotateX(180deg)
                animation rotate-out 1.2s

    .bottom
        margin-top 30px
        display flex
        align-items center
        font-size 22px
        color white
        font-family Arial

        .discord
            padding 10px 15px
            border-radius 4px
            background-color #7289DA
            cursor pointer
            transition 0.2s ease
            display flex
            align-items center

            &:hover
                background-color darken(#7289DA, 10%)

        .documentation
            margin-left 20px
            padding 10px 15px
            border-radius 4px
            background-color #505f73
            cursor pointer
            transition 0.2s ease
            display flex
            align-items center

            &:hover
                background-color darken(#505f73, 10%)

    .home-content
        z-index 1
        display flex
        flex-direction column
        align-items center

    .footer
        position absolute
        bottom 20px
        left 0
        width 100vw
        color rgba(255, 255, 255, .5)
        text-align center
        text-transform uppercase
        font-family Roboto
        font-size 14px

    .darken
        background-color rgba(0, 0, 0, 0.6)

    .discord-logo
        display inline-block
        width 20px
        height 20px
        margin-right 5px
        background-image url(https://discordapp.com/assets/1c8a54f25d101bdc607cec7228247a9a.svg)
        background-size cover

    @keyframes rotate-in {
        0% {
            transform: rotateX(180deg);
            opacity: 0;
        }
        35% {
            transform: rotateX(120deg);
            opacity: 0;
        }
        65% {
            opacity: 0;
        }
        100% {
            transform: rotateX(360deg);
            opacity: 1;
        }
    }

    @keyframes rotate-out {
        0% {
            transform: rotateX(0deg);
            opacity: 1;
        }
        35% {
            transform: rotateX(-40deg);
            opacity: 1;
        }
        65% {
            opacity: 0;
        }
        100% {
            transform: rotateX(180deg);
            opacity: 0;
        }
    }
</style>