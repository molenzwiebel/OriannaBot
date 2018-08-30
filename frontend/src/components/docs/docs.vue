<template>
    <div class="docs">
        <div class="header">
            <div class="title">Documentation</div>
            <div class="subtitle"><i>"I know what makes them tick."</i></div>
        </div>

        <div class="body">
            <div class="segments">
                <router-link to="/docs/commands" class="segment">
                    <div class="blorb"
                         style="background-image: url(//ddragon.leagueoflegends.com/cdn/img/champion/splash/Orianna_5.jpg)"></div>

                    <div class="title">Command Reference</div>
                </router-link>

                <router-link to="/docs/link" class="segment">
                    <div class="blorb"
                         style="background-image: url(//ddragon.leagueoflegends.com/cdn/img/champion/splash/Orianna_0.jpg)"></div>

                    <div class="title">Adding Your Account To Orianna</div>
                </router-link>

                <router-link to="/docs/conditions" class="segment">
                    <div class="blorb"
                         style="background-image: url(//ddragon.leagueoflegends.com/cdn/img/champion/splash/Orianna_6.jpg)"></div>

                    <div class="title">Role Conditions: The Definite Tutorial</div>
                </router-link>

                <router-link to="/docs/setup" class="segment">
                    <div class="blorb"
                         style="background-image: url(//ddragon.leagueoflegends.com/cdn/img/champion/splash/Orianna_7.jpg)"></div>

                    <div class="title">Adding Orianna To Your Server</div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<style lang="stylus" scoped>
    segment-height = 170px
    segment-width = 360px
    blorb-height = 110px
    title-width = (segment-width + 20px) * 3

    @import "./docs-common.styl"

    .docs
        .segments
            display flex
            flex-wrap wrap
            max-width title-width
            margin 0 auto

        .segment
            margin 10px
            width segment-width
            height segment-height
            border-radius 2px
            box-shadow 0 1px #dcdfdf
            background-color white
            text-decoration none
            border 1px solid #cdd2d2
            transition 0.2s ease

            &:hover
                transform scale(1.02)

            .blorb
                background-size cover
                width 100%
                height blorb-height

            & .title
                padding 10px
                line-height segment-height - blorb-height - 20px
                font-family Roboto
                color #111
                font-size 20px
</style>