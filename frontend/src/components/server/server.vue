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

                <div class="setting">
                    <b>Language</b>
                    <select @change="updateLanguage">
                        <option v-for="lang in languages" :value="lang.code" :selected="lang.code === server.language">{{ lang.name }}</option>
                    </select>
                    <p>The language used when Orianna responds to a command. Member language preferences will be prioritized over the server language. Don't see your language? <a href="/translate/">Contribute a translation!</a></p>
                </div>

                <div class="setting">
                    <b>Engagement Mode</b>

                    <select @change="updateEngagement">
                        <option value="on_command" :selected="server.engagement.type === 'on_command'">When the user first uses an Orianna command</option>
                        <option value="on_join" :selected="server.engagement.type === 'on_join'">When the user joins the server</option>
                        <option value="on_react" :selected="server.engagement.type === 'on_react'">When the user reacts to a certain message</option>
                    </select>

                    <template v-if="server.engagement.type === 'on_react'">
                        <p class="padded bold">In which channel should Orianna listen for reactions?</p>

                        <select v-model="server.engagement.channel" @change="saveEngagement">
                            <option v-for="channel in server.discord.channels" :value="channel.id">#{{ channel.name }}</option>
                        </select>

                        <p class="padded bold">Which reaction emote should Orianna listen to? Enter the emote as <code>emoteName:emoteID</code>. You can find the emote ID by sending a Discord message with the emote with a backslash in front of it (<code>\:wow:</code> for example).</p>

                        <div class="emote-alongside-text">
                            <img :src="emoteImage">
                            <input type="text" v-model="server.engagement.emote" placeholder="emoteName:emoteID" @blur="saveEngagement">
                        </div>
                    </template>

                    <p class="padded">
                        This option configures when Orianna will first introduce herself to any members of the server. This introduction will be done through private messages and contains a small explanation about Orianna alongside instructions on how to add an account.
                    </p>

                    <p v-if="server.engagement.type === 'on_command'">
                        With the current setting, Orianna will send a message when the user first uses an Orianna command such as <code>@Orianna Bot configure</code>. If the user has previously received a message, they will not receive it again.
                    </p>

                    <p v-if="server.engagement.type === 'on_join'">
                        With the current setting, Orianna will send a message when the user joins the server. If the user has previously received a message or already has commands set up, they will not receive the message. Please note that users are usually suspicious of bot DMs that arrive immediately when they join a server.
                    </p>

                    <p v-if="server.engagement.type === 'on_react'">
                        With the current setting, Orianna will send a message to anyone that reacts with <span class="bold">:{{ server.engagement.emote.split(":")[0] || "emote" }}:</span> in #{{ server.discord.channels.find(x => x.id === server.engagement.channel).name }}. Usually this configuration is used with a general introduction channel where a single reaction is already added, so that a user can proceed with a single click. Orianna will automatically remove the added reaction and always send the message, regardless of whether the user already has experience with Orianna.
                    </p>
                </div>

                <div class="setting">
                    <b>Nickname Pattern</b>

                    <div class="checkbox-aside">
                        <input type="checkbox" v-model="nickEnabled" @change="updateNicknamePattern" style="margin-right: 5px; margin-bottom: 2px">
                        <span>Have Orianna automatically assign nicknames based on the configured pattern.</span>
                    </div>

                    <input v-model="server.nickname_pattern" type="text" placeholder="[{region}] {username}" :disabled="!nickEnabled" @change="updateNicknamePattern">

                    <p class="padded">
                        Orianna is able to enforce a consistent nickname pattern for everyone on your server! Users can pick a "primary"
                        account on their profile which will be used for building their nickname. Simply enter a nickname and Orianna will
                        ensure that anyone with a configured account matches the pattern. You can use <code>{region}</code> and <code>{username}</code>
                        as placeholders for the user's account.
                    </p>

                    <p>
                        For example, if you want everyone's nickname to follow the pattern <code>IGN: My Summoner Name Here</code>, you
                        can use the pattern <code>IGN: {username}</code>.
                    </p>

                    <p>
                        Note that Orianna will only assign nicknames for users that have an account registered with Orianna. Orianna will also
                        not prevent users from changing their nickname manually, so you will need to ensure that your permissions are set up
                        such that users cannot change their own nickname.
                    </p>

                    <p>
                        <template v-if="nickEnabled">
                            With the current setting, Orianna will assign a nicknames that look like <span style="font-weight: bold">{{ nickExample }}</span>.
                        </template>

                        <template v-else>
                            With the current setting, Orianna will not touch any nicknames.
                        </template>
                    </p>
                </div>

                <div class="setting">
                    <b>Server Leaderboard Role Requirement</b>

                    <select @change="updateLeaderboardRoleRequirement">
                        <option value="null" :selected="!server.server_leaderboard_role_requirement">Include All Members On The Server</option>
                        <option disabled>──────────</option>
                        <option v-for="role in server.discord.roles" :value="role.id" :selected="server.server_leaderboard_role_requirement === role.id">Require @{{ role.name }}</option>
                    </select>

                    <p>
                        Which members to include in the server leaderboard (<code>@Orianna Bot top server</code>). If you require a role in order to view the server,
                        use this setting to ensure that only members with that role show up in your server leaderboards.
                    </p>
                </div>
            </div>
        </div>

        <div class="box">
            <div class="header"><h2>Assign Rules</h2></div>

            <div v-if="server.roles.length">
                <role-conditions
                        v-for="role in server.roles"
                        ref="roleElements"
                        :role="role"
                        :discord-roles="server.discord.roles"
                        :highest="server.discord.highestRole"
                        :key="role.id"
                        @dirty="updateDirty"
                        @delete="deleteRole(role)"
                ></role-conditions>
            </div>

            <div class="no-roles" v-if="!server.roles.length">
                <img src="https://ddragon.leagueoflegends.com/cdn/7.5.2/img/sticker/poro-question.png">
                <p><b>There are no rules configured.</b> Add your own or import a preset below!</p>
            </div>

            <div class="add-role">
                <div class="input">
                    <vue-suggest
                            placeholder="Role Name..."
                            v-model="roleName"
                            :list="roleNames"
                            :filter-by-query="true">
                    </vue-suggest>

                    <a class="button" @click="addRole">Add Rule</a>
                </div>

                <a class="button" @click="openPresetsModal">Presets</a>
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
                    <a class="button" @click="addBlacklistedChannel">
                        Blacklist Channel
                    </a>
                </div>
            </div>
        </div>

        <transition name="slide">
            <div class="box unsaved" v-if="rolesDirty">
                <span>
                    <span style="color: red">Warning: </span>
                    You have unsaved role changes!
                </span>
                <a href="#" @click.prevent="saveUnsavedRoles" class="button save">Save Now</a>
            </div>
        </transition>

        <transition name="slide">
            <div class="box unsaved" v-if="message">
                {{ message }}
            </div>
        </transition>
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

                &.padded
                    margin 8px 0

            .bold
                font-weight bold

            .checkbox-aside
                display flex
                flex-direction row
                align-items center
                margin 10px 0

        .setting + .setting
            margin-top 20px

        .no-roles
            padding 20px
            display flex
            flex-direction column
            align-items center
            jusitify-content center
            color #333
            border-bottom 1px solid #d5d5d5

            img
                filter grayscale()
                opacity 0.6
                width 160px

            p
                max-width 300px
                text-align center

        .add-role
            display flex
            align-items center
            justify-content space-between
            margin 10px

            .button
                width auto
                height 35px
                line-height 35px
                padding 0 10px

            .input
                display flex
                align-items center

            .vue-simple-suggest.designed
                position relative

                .suggestions
                    position absolute
                    background-color white
                    border 1px solid #c1c1c1
                    width 100%

                .suggest-item
                    cursor pointer
                    font-size 14px
                    padding 5px
                    transition 0.1s ease

                .suggest-item.selected, .suggest-item.hover
                    color white
                    background-color #20afef

            .vue-simple-suggest.designed input
                height 35px
                padding 0 10px
                border 1px solid #c1c1c1
                transition 0.2s ease

                &:focus
                    outline none
                    border-color #1f9fde

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

            .actions > a
                text-decoration none
                color #1e87f0
                font-size 30px

        .blacklist
            padding 20px
            display flex

        .unsaved
            font-size 18px
            height 50px
            position fixed
            bottom 20px
            width 700px
            max-width 700px
            align-self center
            padding 5px 10px
            display flex
            align-items center
            justify-content space-between
            box-shadow 0 2px 10px 0 rgba(0,0,0,.2)

            .button
                width auto
                height 30px
                line-height 30px
                padding 0 10px
                text-decoration none
                font-size 14px
                text-transform uppercase

        .button
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

    .emote-alongside-text
        display flex

        img
            display inline-block
            margin-right 10px
            height 40px

        input[type=text]
            display inline-block
            padding-right 20px

    // Animation for unsaved roles.
    .slide-enter-active
        animation slide-up .5s

    .slide-leave-active
        animation slide-up .5s reverse

    @keyframes slide-up
        0%
            transform translateY(200px)
        100%
            transform translateY(0)
</style>