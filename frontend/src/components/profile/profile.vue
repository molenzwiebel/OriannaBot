<template>
    <div class="user-profile" v-if="user">
        <div class="box">
            <div class="header accounts-header">
                <h2>Your League Accounts</h2>

                <div class="actions" v-if="user.accounts.length">
                    <a class="small-button" @click.prevent="addAccount" href="#">Add New</a>
                    <a class="small-button" @click.prevent="importRedditAccounts" href="#">Import From <i class="ion-social-reddit-outline"></i></a>
                </div>
            </div>

            <div class="body accounts">
                <div class="account-list-header">
                    <div class="img" />
                    <div class="username">Summoner Name</div>
                    <div class="primary">
                        Primary
                        <i class="ion-help-circled" v-tippy title="Orianna can be configured by a server admin to automatically update your nickname on that server. Your primary account will be used for this nickname, so you're recommended to use your most played account as your primary one." />
                    </div>
                    <div class="show-profile">
                        Show On Profile
                        <i class="ion-help-circled" v-tippy title="Whether this account should be shown when you use the profile command." />
                    </div>
                    <div class="use-region-role">
                        Use For Region Roles
                        <i class="ion-help-circled" v-tippy title="Whether this account should be included when computing region roles. Use this if you have a smurf on NA but don't want to have the NA role because you barely play there." />
                    </div>
                    <div class="actions"></div>
                </div>

                <div v-for="account in user.accounts" class="account" :key="account.region + account.summoner_id">
                    <div class="avatar-container">
                        <img :src="`https://avatar.leagueoflegends.com/${account.region}/${encodeURIComponent(account.username)}.png`">
                    </div>
                    <span class="username">{{ account.region }} - {{ account.username }}</span>
                    <div class="primary">
                        <input type="checkbox" :checked="account.primary" @click="handlePrimarySet(account)" />
                    </div>
                    <div class="show-profile">
                        <input type="checkbox" v-model="account.show_in_profile" @change="handlePrivacyUpdate(account)" />
                    </div>
                    <div class="use-region-role">
                        <input type="checkbox" v-model="account.include_region" @change="handlePrivacyUpdate(account)" />
                    </div>
                    <span class="actions">
                        <a href="#" @click.prevent="deleteAccount(account)"><i class="ion-ios-trash-outline"></i></a>
                    </span>
                </div>

                <div class="no-accounts" v-if="!user.accounts.length">
                    <img src="https://ddragon.leagueoflegends.com/cdn/7.5.2/img/sticker/poro-question.png">
                    <p><b>You have no accounts configured.</b> Add one to begin tracking mastery score:</p>
                    <div class="actions">
                        <a class="small-button" @click.prevent="addAccount" href="#">Add New</a>
                        <a class="small-button" @click.prevent="importRedditAccounts" href="#">Import From <i class="ion-social-reddit-outline"></i></a>
                    </div>
                </div>
            </div>
        </div>

        <div class="box">
            <div class="header"><h2>Account Settings</h2></div>
            <div class="body">
                <div class="setting" style="margin-top: 4px">
                    <b>Language</b>
                    <select @change="updateLanguage">
                        <option value="" :selected="user.language === ''">Use Server Language</option>
                        <option v-for="lang in languages" :value="lang.code" :selected="lang.code === user.language">{{ lang.name }}</option>
                    </select>
                    <p>Orianna will always use this language when responding to you, regardless of the language of the server you're in. Don't see your language? <a href="/translate/">Contribute a translation!</a></p>
                </div>

                <div class="setting">
                    <div>
                        <input type="checkbox" v-model="user.treat_as_unranked" @change="updatePrivacySettings" style="margin-right: 5px; margin-bottom: 2px">
                        <b>Hide Ranked Tier</b>
                    </div>
                    <p style="margin-bottom: 3px">When enabled, this will cause Orianna Bot to treat you as if you were unranked in all ranked queues. Note that this may affect which roles within a server you are eligible for.</p>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="loader">Loading...</div>
</template>

<script lang="ts" src="./profile.ts"></script>

<style lang="stylus">
    .user-profile
        align-self flex-start
        display flex
        flex-direction column

        .setting > div
            display flex
            align-items center

        .setting > select
            margin-top 10px

        .actions
            display flex

        .small-button
            border 1px solid #dcdcdc
            text-decoration none
            text-transform uppercase
            margin 0 4px
            padding 4px 6px
            color #333
            display flex
            align-items center
            transition 0.2s ease

            & i
                margin-left 3px

        .discord-logo
            display inline-block
            width 20px
            height 20px
            background-image url(https://discordapp.com/assets/41484d92c876f76b20c7f746221e8151.svg)
            background-size cover

        .small-button:hover
            border-color #b2b2b2

        .accounts-header
            display flex
            align-items center

            h2
                flex 1

        .accounts
            padding 0

        avatar-width = 75px
        primary-width = 90px
        profile-width = 130px
        region-roles-width = 150px
        actions-width = 40px

        .accounts .account-list-header
            display flex
            align-items center
            font-size 14px
            font-weight bold
            padding 10px 0

            .img
                flex 0 avatar-width

            .username
                flex 1

            .primary
                flex 0 primary-width
                margin-right 10px

            .show-profile
                flex 0 profile-width
                margin-right 10px

            .use-region-role
                flex 0 region-roles-width
                margin-right 10px

            .actions
                flex 0 actions-width

        .accounts .account
            display flex
            align-items center
            padding 12px 0

            .avatar-container
                flex 0 avatar-width

            img
                margin-left 10px
                width 45px
                height 45px
                border-radius 50%
                border 3px solid #ae8939

            .username
                font-size 17px
                flex 1

            .primary
                flex 0 primary-width
                margin-right 10px

            .show-profile
                flex 0 profile-width
                margin-right 10px

            .use-region-role
                flex 0 region-roles-width
                margin-right 10px

            .actions
                flex 0 actions-width
                display flex
                flex-direction column
                align-items flex-end

            .actions > a
                margin-right 15px
                text-decoration none
                color #1e87f0
                font-size 30px

        .accounts .account:nth-child(2n)
            background-color #f9f9f9

        .accounts .account:not(:first-of-type)
            border-top 1px solid #cdd2d2

        .no-accounts
            padding 20px
            display flex
            flex-direction column
            align-items center
            jusitify-content center
            color #333

            img
                filter grayscale()
                opacity 0.6
                width 160px

            p
                max-width 300px
                text-align center
</style>