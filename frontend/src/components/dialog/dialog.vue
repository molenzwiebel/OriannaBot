<template>
    <div class="dialog box">
        <div class="header"><h2>{{ title }}</h2></div>
        <div class="body">
            <p v-html="details"></p>
            <div class="buttons">
                <a class="button" v-for="button in buttons" @click="$emit('close', button.value)" :style="`background-color: ${button.bg}; border-color: ${button.border || button.fg}; color: ${button.fg}`">
                    {{ button.text }}
                </a>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ["title", "details", "buttons"]
    };
</script>

<style lang="stylus">
    .dialog
        max-width 500px

        .buttons
            display flex
            justify-content flex-end

        .button
            text-decoration none
            text-transform uppercase
            margin 0 4px
            padding 4px 6px
            letter-spacing 0.5px
            font-size 16px
            font-weight 300
            border 1px solid transparent
            cursor pointer
</style>