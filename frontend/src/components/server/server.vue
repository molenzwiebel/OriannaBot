<template>
    <div class="server-profile" v-if="server">
        <div class="box">
            <div class="header"><h2>Configure {{ server.name }}</h2></div>
            <div class="body">
            </div>
        </div>
    </div>

    <div v-else class="loader">Loading...</div>
</template>

<script lang="ts" src="./server.ts"></script>

<style lang="stylus">
    .server-profile
        align-self flex-start
        display flex
        flex-direction column
</style>