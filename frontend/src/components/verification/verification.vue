<template>
    <div class="verification">
        <img ref="img3" class="img3" src="https://i.imgur.com/s3047UE.png">
        <img ref="img2" class="img2" src="https://i.imgur.com/tHyZZoS.png">
        <img ref="img1" class="img1" src="https://i.imgur.com/3AtpSos.jpg">
        <img ref="cursor" class="cursor" src="https://i.imgur.com/9wT5L9h.png">
        <span ref="textfield" class="textfield"></span>

        <a class="replay" href="#" v-if="!playing" @click="resetAndPlay"><i class="ion-refresh"></i></a>
    </div>
</template>

<script lang="ts">
    const delay = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

    export default {
        props: ["code"],
        data: () => ({ playing: true }),
        mounted() {
            this.play();
        },
        methods: {
            async play() {
                this.playing = true;
                const { cursor, img1, img2, img3, textfield } = this.$refs;

                cursor.style.transition = "1.7s ease";
                await delay(10); // chrome seems to skip the initial animation if this isn't here
                cursor.style.transform = "translate(544px, 16px)";

                await delay(1800);

                img1.style.display = "none";

                img2.style.transition = "1.4s ease";
                img2.style.transform = "translate(-280px, -420px)";

                cursor.style.transform = "translate(50px, 160px)";

                await delay(1800);

                img2.style.display = "none";

                img3.style.transition = "0.8s ease";
                img3.style.transform = "translate(-300px, -80px)";

                cursor.style.transform = "translate(210px, 135px)";

                await delay(1800);

                for (let i = 0; i <= this.code.length; i++) {
                    textfield.innerText = this.code.substring(0, i) + (i !== this.code.length ? "|" : "");
                    await delay(70);
                }

                await delay(500);

                textfield.style.transition = "0.8s ease";
                textfield.style.transform = "translate(-90px, 0)";

                img3.style.transform = "translate(-390px, -80px)";
                cursor.style.transform = "translate(560px, 132px)";

                await delay(1800);
                this.playing = false;
            },
            resetAndPlay() {
                const { cursor, img1, img2, img3, textfield } = this.$refs;
                cursor.setAttribute("style", "");
                img1.setAttribute("style", "");
                img2.setAttribute("style", "");
                img3.setAttribute("style", "");
                textfield.setAttribute("style", "");
                textfield.innerText = "";
                this.play();
            }
        }
    };
</script>

<style lang="stylus" scoped>
    .verification
        width 600px
        height 250px
        overflow hidden
        position relative

    .cursor, .img1, .img2, .img3, .textfield
        position absolute
        left 0
        top 0

    .img1, .img2
        transform translate(-680px, 0)

    .img3
        transform translate(-280px, -420px)

    .cursor
        width 12px
        transform translate(100px, 200px)

    .textfield
        top 121px
        left 198px
        font-family Roboto
        font-size 14px
        color white

    .replay
        position absolute
        right 0
        top 0
        padding 10px
        color white
        font-size 24px
        background-color rgba(0, 0, 0, 0.8)
</style>