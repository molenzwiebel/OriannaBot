<template>
    <div class="user-profile box" v-if="user">
        <div class="header">
            <h2>{{ user.username }}</h2>
        </div>
        <div class="body">
            {{ user.accounts[0].username }}
        </div>
    </div>
</template>

<script lang="ts" src="./profile.ts"></script>

<style lang="stylus">
    .user-profile
        align-self flex-start
</style>