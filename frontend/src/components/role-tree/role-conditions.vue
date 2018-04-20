<template>
    <div class="role-conditions">
        <div class="header">
            <div class="left">
                <a :class="expanded ? 'ion-minus' : 'ion-plus'" class="expand" @click="expanded = !expanded"></a>

                <span :style="'color: ' + color">{{ role.name }}</span>
                <i
                        class="ion-alert-circled"
                        v-if="!matchingDiscord"
                        title="There is no Discord role with the specified name detected. This role will not be assigned to players until there is a matching Discord role."
                        v-tippy>
                </i>
            </div>

            <div>
                <a v-show="expanded" href="#" class="small-button" v-if="!matchingDiscord" @click.prevent="linkRole">Create Discord Role</a>
                <a v-show="expanded" href="#" class="small-button" @click.prevent="addCondition">Add Condition</a>
                <a v-show="expanded" href="#" class="small-button" :title="valid ? '' : 'Some of your conditions are not complete. Check them before trying to save.'" :disabled="!(dirty && valid)" v-tippy @click.prevent="save">Save</a>
                <a href="#" class="small-button" @click.prevent="deleteRole">Delete</a>
            </div>
        </div>

        <div class="body" v-if="expanded">
            <span class="body-header">Conditions <i class="ion-help-circled" title="A user is eligible for a role if they apply for ALL of the conditions listed below." v-tippy></i></span>
            <div class="conditions">
                <div class="condition" v-for="condition in conditions">
                    <a class="ion-ios-close-empty" @click="removeCondition(condition)"></a>
                    <tree :options="condition.opts" @change="handleChange($event, condition)"></tree>
                </div>
            </div>

            <span class="body-header">Settings</span>
            <div class="settings">
                <label><input type="checkbox" v-model="role.announce" @change="dirty = true"> <b>Announce Promotions</b></label>
                <p>If this is checked, a promotion message will be sent in the configured announcement channel whenever a member receives the roles. Use this if you'd like to announce milestones.</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" src="./role-conditions.ts"></script>

<style lang="stylus">
    .role-conditions
        .header
            font-size 20px
            height 45px
            display flex
            align-items center
            padding-left 5px
            background-color #fdfdfd
            border-bottom 1px solid #d5d5d5

            span
                margin 0 5px

            .expand
                border-right 1px solid #d5d5d5
                height 45px
                width 45px
                display inline-block
                line-height 45px
                font-size 22px
                text-align center
                cursor pointer

                &::before
                    line-height 45px

            .left
                flex 1

            .left, div
                display flex
                align-items center

            .small-button
                border 1px solid #dcdcdc
                text-decoration none
                text-transform uppercase
                margin 0 4px
                padding 4px 6px
                font-size 14px
                color #333
                transition 0.2s ease

                &[disabled]
                    color #8f8f8f
                    cursor not-allowed

            .small-button:hover:not([disabled])
                border-color #b2b2b2

        .body
            border-bottom 1px solid #d5d5d5

            .body-header
                font-size 18px
                padding 10px 5px
                font-weight 700
                width 100%
                border-bottom 1px solid #f1f1f1
                display inline-block

            .body-header ~ .body-header
                margin-top 20px

            .condition
                display flex
                align-items center

            .condition + .condition
                border-top 1px solid #f1f1f1

            .condition:last-child
                border-bottom 1px solid #f1f1f1

            .tree
                border-left 1px solid #d5d5d5
                padding 0 0 0 4px

            .condition .ion-ios-close-empty
                font-size 40px
                padding 0 10px
                cursor pointer

            .settings
                padding 10px 10px 0 10px

            .settings label
                display flex
                align-items center

            .settings p
                margin-top 5px

            .settings input[type=checkbox]
                height 20px
                width 20px
                margin-right 5px
</style>