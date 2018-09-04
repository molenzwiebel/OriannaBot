<template>
    <div class="docs">
        <div class="header">
            <div class="title">Adding Orianna To Your Server</div>
            <div class="subtitle"><i>"This is a fun game."</i></div>
        </div>

        <div class="body">
            <div class="content">
                <p>Begin adding Orianna to your server by clicking <a href="/api/v1/discord-link">this link</a> to
                    invite her to your server. Select your server from the dropdown and press <code>Authorize</code> to
                    confirm that you want to add Orianna Bot. After clicking Authorize, you will be redirected back to
                    the Orianna web interface to setup roles and other settings.</p>

                <p>You'll first have to choose whether or not your server is a "mains" server, dedicated to just a
                    single champion. If it is, select the left option. If not, select the right option. Depending on
                    your choice, you will see different setup wizards, as described below.</p>

                <h2 id="mainsservers">Mains Servers</h2>

                <p>If your server is largely dedicated towards a single champion, select the mains option. Selecting
                    this option will show you an interface where you have to select the champion in question. This
                    champion will then be used as the default champion for any commands used on your server, unless a
                    specific champion is mentioned in the command.</p>

                <p>After this, you will get various options to add a preset list of roles to your server:</p>

                <ul>
                    <li>Enabling the <strong>Region Roles</strong> option will enable assigning regional roles (EUW, NA,
                        EUNE, ...) to anyone that has an account on one of those regions.
                    </li>

                    <li>Enabling the <strong>Ranked Roles</strong> option will enable assigning ranked tier roles
                        (Bronze, Silver, Gold, ...) to anyone whose highest tier (regardless of ranked queue) is that
                        specific queue.
                    </li>

                    <li>Enabling the <strong>Mastery Roles</strong> option and choosing any of the given presets will
                        prepopulate your list of roles with their <a href="/docs/conditions">conditions</a>. These are
                        merely recommendations for how you can setup your roles and are completely optional.
                    </li>
                </ul>

                <p>Note that you have plenty of chances later to adjust or add roles. The options given in the
                    introduction wizard are only for a quick and easy setup.</p>

                <p>After selecting whether or not you want any preset roles, you can choose to enable promotion messages
                    that show a celebration image whenever someone gains a new role. You will be able to turn promotion
                    messages on or off per role later.</p>

                <p>When you're satisfied with the options, simply press <code>Complete Setup</code> to confirm the
                    options and return to the server configuration page for your Discord server. Your server is now
                    setup with Orianna!</p>

                <h2 id="otherservers">Other Servers</h2>

                <p>If your server is not dedicated towards a single champion, such as a Discord server for a specific
                    role or just a normal League server, select the all-round option. Selecting this option will not
                    setup a default champion for commands, requiring that any command used within your server also
                    contain a champion name.</p>

                <p>After selecting the all-round option, you will have the ability to enable role presets:</p>

                <ul>
                    <li>Enabling the <strong>Region Roles</strong> option will enable assigning regional roles (EUW, NA,
                        EUNE, ...) to anyone that has an account on one of those regions.
                    </li>

                    <li>Enabling the <strong>Ranked Roles</strong> option will enable assigning ranked tier roles
                        (Bronze, Silver, Gold, ...) to anyone whose highest tier (regardless of ranked queue) is that
                        specific queue.
                    </li>
                </ul>

                <p>Note that you have plenty of chances later to adjust or add roles. The options given in the
                    introduction wizard are only for a quick and easy setup.</p>

                <p>When you're satisfied with the options, simply press <code>Complete Setup</code> to confirm the
                    options and return to the server configuration page for your Discord server. Your server is now
                    setup with Orianna!</p>
            </div>
        </div>
    </div>
</template>

<style lang="stylus" scoped>
    title-width = 840px

    @import "./docs-common.styl"

    .body
        .content
            padding 10px
            max-width title-width
            margin 0 auto
            font-family Roboto

            @import "./markdown-styles.styl"
</style>