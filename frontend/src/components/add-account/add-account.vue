<template>
    <div class="box add-account">
        <div class="header">
            <h2>Add Account</h2>
        </div>

        <div class="step-body">
            <form-wizard ref="wizard" shape="tab" color="#3380e5" error-color="red" :next-button-text="nextButton" @on-change="handleTabChange" @on-complete="$emit('close', summoner)">
                <tab-content title="Account" :before-change="requestSummoner">
                    <div class="details">
                        <select :class="detailsError && 'errored'" v-model="region">
                            <option value="disabled">Region</option>
                            <option value="EUW">EUW</option>
                        </select>

                        <input :class="detailsError && 'errored'" type="text" v-model="name" placeholder="Summoner Name">
                    </div>

                    <span class="details-error">{{ detailsError }}</span>
                </tab-content>
                <tab-content title="Verification" :before-change="verifySummoner">
                    <div class="verification-step" v-if="summoner">
                        <p>
                            To verify that you own <b>{{ summoner.username }}</b>, please change your third-party verification code to <code>{{ summoner.code }}</code>.
                            To change your third-party code, go to your <b>settings</b> inside the League client, followed by selecting <b>Verification</b> and entering the code. Click <b>Verify</b> after you've saved.
                            <br><br>
                            Note: The third-party code feature is unstable at this time. It may take a few tries before the change gets detected. You may also need to restart your League client for it to work. Riot is aware of the issues and is working on a fix.
                        </p>
                        <verification v-if="summoner" :code="summoner.code"></verification>
                        <span class="details-error">{{ verificationError }}</span>
                    </div>
                </tab-content>
                <tab-content title="Done!">
                    <div class="verified" v-if="summoner">
                        <img src="https://ddragon.leagueoflegends.com/cdn/7.5.2/img/sticker/poro-coolguy.png">
                        <p><b>Account verified!</b> Your stats and roles will update momentarily.</p>
                    </div>
                </tab-content>
            </form-wizard>
        </div>
    </div>

</template>

<script lang="ts" src="./add-account.ts"></script>

<style lang="stylus">
    .add-account
        max-width 640px

        .details
            display flex

        .details .errored
            border 1px solid red

        .details select
            flex 0 110px
            margin-right 10px

        .details-error
            width 100%
            display block
            text-align right
            font-size 14px
            padding 10px
            padding-right 0
            color red

        .verification-step
            display flex
            flex-direction column

            p
                margin 5px 0 10px 0

            .verification
                align-self center
                margin 10px

        .verified
            display flex
            flex-direction column
            align-items center

            img
                width 200px

            p
                margin 10px
                text-align center

    .step-body
        padding-top 10px

    .vue-form-wizard .wizard-header
        display none

    div[role=tab]
        display none !important

    .wizard-progress-with-circle
        height 2px !important
        background-color lightgray

    .wizard-progress-bar
        height 2px !important

    .wizard-tab-content
        padding 10px !important
        padding-top 30px !important

    li:not(.active) .stepTitle
        color rgba(0, 0, 0, 0.6) !important

    span.stepTitle
        text-transform uppercase
        font-weight 400
        letter-spacing 0.4px

    span[role=button] button.wizard-btn
        border-radius 0
        color #3380e5 !important
        background-color white !important
        border-width 1px
        font-weight 300
        text-transform uppercase
        letter-spacing 0.8px
        font-size 14px
</style>