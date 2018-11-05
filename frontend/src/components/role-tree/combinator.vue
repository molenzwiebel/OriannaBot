<template>
    <div class="combinator-picker">
        <select v-model="value.type">
            <option value="all">All must match.</option>
            <option value="any">At least one must match.</option>
            <option value="at_least">{{ value.type === 'at_least' ? "At least" : "At least N conditions must match." }}</option>
        </select>

        <input v-if="value.type === 'at_least'" type="number" v-model="value.amount" placeholder="3">

        <span v-if="value.type === 'at_least'">
            conditions must match.
        </span>

        <i class="ion-help-circled" title="Use this option to configure how conditions are combined. You can either choose to require all conditions to match, to require only one to match, or to require at least a certain amount. For more information, see the documentation on role conditions." v-tippy></i>
    </div>
</template>

<script lang="ts">
    export default {
        props: ["value"]
    };
</script>

<style lang="stylus" scoped>
    .combinator-picker
        display flex
        align-items center

        span
            font-size 16px
            color black
            font-weight 400
            width 100%

        select, input
            background-color transparent
            border none
            height 30px
            transition 0.2s ease
            padding 0
            font-size 16px
            color black

            &:focus
                outline none
                border-bottom-color #3380e5

        input
            width 40px
            border-bottom 1px solid
</style>