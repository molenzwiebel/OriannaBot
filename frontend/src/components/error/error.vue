<template>
    <div class="error-dialog">
        <img src="https://ddragon.leagueoflegends.com/cdn/7.5.2/img/sticker/poro-shock.png">
        <div class="details">
            <span>{{ title }}</span>
            <p>{{ details }}</p>
            <a :href="signInLink" v-if="showLogin">Sign In With Discord</a>
        </div>
    </div>
</template>

<script lang="ts">
    import { API_HOST } from "../../config";

    export default {
        props: ["title", "details", "showLogin"],
        computed: {
            signInLink: function() {
                return API_HOST + "/api/v1/discord";
            }
        }
    };
</script>

<style lang="stylus" scoped>
    .error-dialog
        display flex
        flex-direction column
        align-items center

        & > img
            filter grayscale()
            width 200px
            height 200px

        .details
            display flex
            flex-direction column
            align-items center
            font-family Roboto

        .details span
            padding-top 20px
            font-weight bold
            text-transform uppercase
            letter-spacing 1px
            font-size 26px

        .details p
            margin 20px 10px
            font-size 18px
            max-width 500px
            text-align center

        .details a
            padding 10px
            text-transform uppercase
            text-decoration none
            background-color white
            color #3487ee
            border 1px solid #3466c9
            transition 0.2s ease

        .details a:hover
            background-color #eef8ff
</style>