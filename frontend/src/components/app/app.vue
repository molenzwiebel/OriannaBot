<template>
    <div class="contents">
        <sidebar :user="user"></sidebar>

        <div class="view">
            <error v-if="error" :title="error.title" :details="error.details" :show-login="error.showLogin"></error>
            <router-view v-else></router-view>
        </div>
    </div>
</template>

<script lang="ts" src="./app.ts"></script>

<style lang="stylus">
    navbar-width = 240px

    .contents
        height 100%
        width 100%

    .view
        margin-left navbar-width
        height 100%
        display flex
        align-items center
        justify-content center
        background-color #fafafa
</style>