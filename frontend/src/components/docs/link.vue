<template>
    <div class="docs">
        <div class="header">
            <div class="title">Adding Your Account To Orianna</div>
            <div class="subtitle"><i>"This is very exciting."</i></div>
        </div>

        <div class="body">
            <div class="content">
                <p>When first interacting with Orianna Bot through a command (or by using <code>@Orianna Bot edit</code>),
                    you will receive a DM from her with a private link leading to your personal configuration page. From
                    this page, you can add and remove League accounts that are bound to your Discord account. Every
                    account added to your Discord profile will automatically be included in mastery calculations for
                    your account.</p>

                <h2>Adding Accounts</h2>
                <p>To add an account, simply click the <code>Add New</code> button in the accounts section and enter the
                    name and region of the account you wish to add. Clicking check will ensure that the account exists,
                    and will then allow you to proceed to verification. In verification, you are asked to enter a
                    certain code inside the <code>Verification</code> section of your League client. This is done to
                    verify that you own the account you are attempting to add. Upon verification, the account will be
                    added to the list and included in any subsequent mastery updates.</p>

                <p>Note that you may be unable to add an account if it is already linked to a different Orianna Bot
                    profile. This is to prevent people from sharing an account and adding it to multiple Orianna Bot
                    profiles. If you encounter this, contact the creator using <code>@Orianna Bot about</code> with your
                    region and summoner name.</p>

                <h2>Removing Accounts</h2>
                <p>To remove an account, simply click the <i class="ion-ios-trash-outline"></i> icon next to the account
                    you wish to remove. After verifying that you want to remove your account, we will unlink it from
                    your profile. This may cause you to lose ranks in servers, since your mastery total and ranked tiers
                    may decrease.</p>

                <h2>Importing from Reddit</h2>
                <p><strong>To import accounts from the ChampionMains flair system</strong>, click the <code>Import from
                    Reddit</code> button and follow the instructions to verify your Reddit account. We will then import
                    any accounts linked to your Reddit account. <em>Note:</em> The accounts are only imported, not
                    synchronized. Adding a new account to Reddit does not automatically add it to your Discord profile.
                </p>
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
