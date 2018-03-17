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
            <div class="body">
                <i>TODO</i>
            </div>
        </div>

        <div class="box">
            <div class="header"><h2>Blacklisted Channels</h2></div>
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
</style>