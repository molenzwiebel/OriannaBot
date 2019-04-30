<template>
    <div class="contents" :class="isHome && 'home'">
        <transition name="slide-in-left">
            <sidebar v-show="!isHome && navbarShown" :user="user"></sidebar>
        </transition>

        <div class="nav-header">
            <i class="ion-navicon" @click="navbarShown = !navbarShown"></i>
            <span>Orianna Bot</span>
        </div>

        <div class="view">
            <error v-if="error" :title="error.title" :details="error.details" :show-login="error.showLogin"></error>
            <transition name="fade" v-else>
                <!-- We attach a key here to prevent vue from reusing components -->
                <router-view :key="$route.path"></router-view>
            </transition>
        </div>

        <transition name="fade">
            <div v-if="modal" class="modal" ref="modal" @click="$event.target === $refs.modal && (modal.resolve(null), modal = null)">
                <div class="modal-body" @click="(1)">
                    <component :is="modal.component" v-bind="modal.props" @close="(modal.resolve($event), modal = null)"></component>
                </div>
            </div>
        </transition>
    </div>
</template>

<script lang="ts" src="./app.ts"></script>

<style lang="stylus">
    navbar-width = 240px

    .contents
        height 100%
        width 100%

    .nav-header
        display none
        align-items center
        border-bottom 1px solid #cdd2d2
        background-color white

        i
            font-size 38px
            padding 10px 15px

        span
            font-family Roboto
            font-size 23px

    .view
        margin-left navbar-width
        min-height 100%
        display flex
        align-items center
        justify-content center
        background-color #fafafa

    .contents.home .view
        margin-left 0

    .modal
        position fixed
        top 0
        left 0
        bottom 0
        right 0
        background-color rgba(0, 0, 0, 0.6)
        display flex
        justify-content center
        overflow-y auto
        overflow-x hidden
        padding 40px 0

    // On small screens, statically position menu and have a navbar at the top.
    @media only screen and (max-width: 780px)
        .contents .nav-header
            display flex
            position fixed
            top 0
            left 0
            right 0
            height 43px

        .contents .view
            margin-top 43px
            margin-left 0

    // Animation for sliding in and out.
    .slide-in-left-enter-active
        animation slide-in-left .5s

    .slide-in-left-leave-active
        animation slide-in-left .5s reverse

    @keyframes slide-in-left
        0%
            transform translateX(-200px)
        100%
            transform translateX(0)
</style>