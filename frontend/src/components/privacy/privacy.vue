<template>
    <div class="docs privacy">
        <div class="header">
            <div class="title">Privacy and Data Policy</div>
        </div>

        <div class="body">
            <div class="content">
                <h1>Privacy Policy</h1>
                <p>Your privacy is important to us. It is Orianna Bot's policy to respect your privacy regarding any information we may collect from you across our website, https://orianna.molenzwiebel.xyz, the Discord bot, Orianna Bot#9201, and other sites and services we own and operate.</p>
                <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
                <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorised access, disclosure, copying, use or modification.</p>
                <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>
                <p>Our website or bot may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</p>
                <p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p>
                <p>Your continued use of our services will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p>

                <h1>Data Stored</h1>
                <p>Orianna Bot stores the following data or a derivative of the following data to provide you with the service. Per our privacy policy, this data is stored responsibly and can be removed on request.</p>
                <p><b>Discord user ID</b>: Orianna stores your unique Discord user ID to associate your Orianna profile with your Discord account. Orianna may also store your Discord user ID even if you do not have any accounts connected to your Orianna profile. Your Discord user ID will never be used for purposes other than identifying you.</p>
                <p><b>League of Legends account ID</b>: Orianna persists several unique IDs that identify your League of Legends account, for the purposes of requesting statistics from Riot Games. Account IDs are only stored for currently connected accounts and will be purged when an account is disconnected.</p>
                <p><b>League of Legends account statistics</b>: Orianna persists your mastery points values and ranked tier for the purpose of assigning roles. Your ranked tier will be stored even if you have the unranked privacy toggle turned on. This information will be removed when a linked League of Legends account is disconnected.</p>

                <h1>Contact</h1>
                <p>For questions about the privacy policy or to request removal of data, you can contact Orianna Bot through the <a href="https://discord.gg/bfxdsRC">Discord support server</a> or by talking to @molenzwiebel#2773 on Discord. If you prefer email, you can send us a message at orianna at molenzwiebel dot xyz.</p>
            </div>
        </div>
    </div>
</template>

<style lang="stylus" scoped>
    segment-height = 170px
    segment-width = 360px
    blorb-height = 110px
    title-width = (segment-width + 20px) * 3

    @import "../docs/docs-common.styl"

    .privacy
        .content
            padding 10px
            max-width title-width
            margin 0 auto
            font-family Roboto

            @import "../docs/markdown-styles.styl"
</style>