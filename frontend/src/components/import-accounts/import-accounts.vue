<template>
    <div class="box import-account">
        <div class="header">
            <h2>Import From Reddit</h2>
        </div>

        <div class="body">
            <p>
                If you have previously registered with the <a href="http://flairs.championmains.com">ChampionMains flair system</a>, you can import your configured accounts.
                Click on the button below to verify your Reddit account, and then wait for this page to refresh.
            </p>

            <a href="#" class="confirm-button" :class="popup && 'disabled'" @click="openPopup">
                {{ popup ? 'Waiting for verification...' : 'Verify Reddit Account' }}
            </a>
        </div>
    </div>

</template>

<script lang="ts" src="./import-accounts.ts"></script>

<style lang="stylus">
    .import-account
        max-width 640px

        .body
            display flex
            flex-direction column

        .body p
            margin 10px
            padding 0
            font-size 16px
            line-height 20px

        .confirm-button
            align-self center
            text-decoration none
            text-transform uppercase
            margin 5px
            padding 10px 20px
            font-size 18px
            color white
            background-color #1e87f0
            transition 0.2s ease
            cursor pointer

            &.disabled
                opacity 0.7
                cursor not-allowed

            &:not(.disabled):hover
                background-color #0f7ae5
</style>