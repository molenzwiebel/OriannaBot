<template>
    <div class="box add-account">
        <div class="header">
            <h2>Add Account</h2>
        </div>

        <div class="step-body">
            <form-wizard ref="wizard" shape="tab" color="#3380e5" error-color="red" :next-button-text="nextButton" @on-change="handleTabChange" @on-complete="$emit('close', pending)">
                <tab-content title="Account" :before-change="requestSummoner">
                    <div class="details">
                        <select :class="detailsError && 'errored'" v-model="region">
                            <option value="disabled">Region</option>
                            <option value="EUW">EUW</option>
                            <option value="EUNE">EUNE</option>
                            <option value="NA">NA</option>
                            <option value="OCE">OCE</option>
                            <option value="BR">BR</option>
                            <option value="LAN">LAN</option>
                            <option value="LAS">LAS</option>
                            <option value="JP">JP</option>
                            <option value="TR">TR</option>
                            <option value="RU">RU</option>
                            <option value="KR">KR</option>
                            <option value="SEA">SEA</option>
                            <option value="TW">TW</option>
                            <option value="VN">VN</option>
                            <option value="ME">ME</option>
                        </select>

                        <input :class="detailsError && 'errored'" type="text" v-model="name" placeholder="Game Name#tagline">
                    </div>

                    <span class="details-error" v-html="detailsError"></span>
                </tab-content>
                <tab-content title="Verification" :before-change="verifySummoner">
                    <div class="verification-step" v-if="pending">
                        <span class="details-error" v-if="pending.taken">
                            Warning: This account is currently linked with a different Discord account. Adding it to your account will remove it from the other account.
                        </span>

                        <p>
                            To verify that you own <b>{{ pending.gameName }}#{{ pending.tagline }}</b>, please change your summoner icon to the following:<br>
                            <img :src="'https://ddragon.leagueoflegends.com/cdn/12.21.1/img/profileicon/' + pending.targetSummonerIcon + '.png'" />
                            <br><br>
                            After changing your icon, click <b>Validate</b> to add link your account. You can change your icon back after you have successfully verified.
                        </p>

                        <span class="details-error">{{ verificationError }}</span>
                    </div>
                </tab-content>
                <tab-content title="Done!">
                    <div class="verified" v-if="pending">
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
            font-size 14px
            padding 10px
            padding-left 0
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