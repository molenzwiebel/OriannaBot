<template>
    <div class="intro">
        <div class="title">
            <p>Get started with Orianna Bot!</p>
            <span>Which of these two options describes your server best?</span>
        </div>

        <div class="options">
            <div class="option">
                <img src="https://img00.deviantart.net/5480/i/2014/259/5/4/poro_sona_by_ravennoodle-d7zfz38.png">

                <button class="button" @click="redirectTo('main')">Single Champion Fanatics</button>
                <p>Your server is mostly dedicated to a single champion. You want to use Orianna to hand out roles based on champion mastery score.</p>
            </div>

            <div class="option">
                <img src="https://img00.deviantart.net/bcde/i/2013/355/2/d/shyvana__volibear_and_sona_poros_by_benybing-d6ysgtb.png">

                <button class="button" @click="redirectTo('generic')">All-Round League Server</button>
                <p>Your server approves of more than one champion, or no particular champion at all. You want to use Orianna for the mastery tracking commands and to hand out roles based on mastery/ranks across various champions.</p>
            </div>
        </div>

        <div class="skip">
            <a href="#" @click.prevent="skip">I have done this before. Just take me to the settings screen.</a>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        methods: {
            skip() {
                this.$root.submit(`/api/v1/server/${this.$route.params.id}`, "PATCH", {
                    completed_intro: true
                }).then(() => {
                    this.$router.push(`/server/${this.$route.params.id}`);
                });
            },
            redirectTo(path: string) {
                this.$router.push(`/server/${this.$route.params.id}/intro/${path}`);
            }
        }
    };
</script>

<style lang="stylus" scoped>
    .intro
        width 100%
        height 100%
        display flex
        flex-direction column
        align-items center

        .title
            font-family Roboto
            padding-top 20px
            display flex
            align-items center
            flex-direction column

            & p
                margin 0
                color #3380e5
                font-size 28px

            & span
                color #4a4949
                margin-top 5px

        .options
            flex 1
            display flex
            width 100%

            .option
                flex 1
                display flex
                flex-direction column
                align-items center
                justify-content center
                transition 0.2s ease
                font-family Roboto

            .option:first-child
                margin 20px 0
                border-right 0.5px solid alpha(#d5d5d5, 0.8)

            .option img
                filter grayscale()
                transition 0.2s ease
                height 250px
                margin-bottom 60px

            .option button
                border 1px solid #d5d5d5
                background-color #f3f3f3
                color gray
                padding 8px
                font-size 18px
                transition 0.4s ease
                cursor pointer

            .option p
                max-width 400px
                text-align center

            .option:hover img
                filter none

            .option:hover button
                background-color #619ff1
                border-color darken(#619ff1, 5%)
                color white

        .skip
            padding 10px
            font-family Roboto
</style>