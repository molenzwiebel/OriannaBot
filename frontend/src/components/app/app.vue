<template>
    <div class="contents">
        <sidebar :user="user"></sidebar>

        <div class="view">
            <error v-if="error" :title="error.title" :details="error.details" :show-login="error.showLogin"></error>
            <transition name="fade" v-else>
                <router-view></router-view>
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

    .view
        margin-left navbar-width
        height 100%
        display flex
        align-items center
        justify-content center
        background-color #fafafa

    .modal
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        background-color rgba(0, 0, 0, 0.6)
        display flex
        justify-content center
        padding-top 40px
</style>