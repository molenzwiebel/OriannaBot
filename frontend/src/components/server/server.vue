<template>
    <div class="server-profile" v-if="server">
        <div class="box">
            <div class="header"><h2>Configure {{ server.name }}</h2></div>
            <div class="body">
                <div class="setting">
                    <b>Default Champion</b>
                    <champion-dropdown :value="server.default_champion" @input="updateDefaultChampion" allow-null></champion-dropdown>
                    <p>The default champion used in any commands executed on this server if no explicit champion was specified. If your server targets one specific champion, it is recommended to set. If you are a more generic League server, you can leave this empty.</p>
                </div>

                <div class="setting">
                    <b>Announcement Channel</b>
                    <select @change="updateAnnouncementChannel">
                        <option value="null" :selected="!server.announcement_channel">Do Not Make Announcements</option>
                        <option disabled>──────────</option>
                        <option v-for="channel in server.discord.channels" :value="channel.id" :selected="server.announcement_channel === channel.id">#{{ channel.name }}</option>
                    </select>
                    <p>The channel in which role announcements are made. Role announcements are made whenever a user becomes eligible for a role with the announce setting enabled.</p>
                </div>
            </div>
        </div>

        <div class="box">
            <div class="header"><h2>Roles</h2></div>
            <div>
                <role-conditions v-for="role in server.roles" :role="role" :discord-roles="server.discord.roles" :key="role.id"></role-conditions>
            </div>
        </div>

        <div class="box">
            <div class="header"><h2>Blacklisted Channels</h2></div>
            <div class="channels">
                <p>Orianna will refuse to execute commands in any blacklisted channel. Use this feature to keep chat clean, by locking commands to just their intended channels.</p>
                <div class="channel" v-for="channel in blacklistedChannels" :key="channel.id">
                    <span class="name">#{{ channel.name }}</span>
                    <span class="actions">
                        <a href="#" @click="removeBlacklist(channel.id)"><i class="ion-ios-trash-outline"></i></a>
                    </span>
                </div>
                <div class="blacklist">
                    <select v-model="blacklistChannel">
                        <option value="disabled" disabled>Choose Channel...</option>
                        <option v-for="channel in unblacklistedChannels" :key="channel.id" :value="channel.id">#{{ channel.name }}</option>
                    </select>
                    <a @click="addBlacklistedChannel">
                        Blacklist Channel
                    </a>
                </div>
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

        .setting
            b
                display block
                color #333
                font-size 18px
                margin 4px 0

            p
                font-size 16px
                color #424242
                margin 8px 0 0 0

        .setting + .setting
            margin-top 20px

        .channels p
            margin 0
            padding 8px
            border-bottom 1px solid lavender

        .channels .channel
            border-bottom 1px solid lavender
            display flex
            align-items center
            padding 12px 12px

            .name
                font-size 17px
                flex 1

            .actions  > a
                text-decoration none
                color #1e87f0
                font-size 30px

        .blacklist
            padding 20px
            display flex

        .blacklist a
            height 40px
            line-height 40px
            text-align center
            border 1px solid #c1c1c1
            margin-left 10px
            color #333
            width 200px
            cursor pointer
            transition 0.2s ease

            &:hover
                border-color #1f9fde
</style>