<template>
    <div class="rename-role box">
        <div class="header"><h2>Rename {{ role.name }}</h2></div>
        <div class="body">
            <input type="text" v-model="name" placeholder="Role Name">
            <button :disabled="!name" @click="save">Rename</button>
        </div>
    </div>
</template>

<script lang="ts">
    export default {
        props: { role: null },
        data() {
            return {
                name: this.role.name
            };
        },
        methods: {
            save() {
                this.role.name = this.name;
                this.$emit("close");
            }
        }
    };
</script>

<style lang="stylus">
    .rename-role
        max-width 400px

        .body
            display flex

        button
            margin-left 10px
            background-color transparent
            height 40px
            line-height 40px
            text-align center
            border 1px solid #c1c1c1
            color #333
            width auto
            padding 0 10px
            cursor pointer
            transition 0.2s ease

            &:focus
                outline none

            &:hover:not([disabled])
                border-color #1f9fde

            &[disabled]
                color #8f8f8f
                cursor not-allowed
</style>