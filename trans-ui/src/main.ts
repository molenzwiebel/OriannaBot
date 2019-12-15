import Vue from "vue";
import App from "./App.vue";
import "./static/discord.css";
import "./global.styl";
import vuetify from "./plugins/vuetify";

Vue.config.productionTip = false;

new Vue({
    vuetify,
    render: h => h(App)
}).$mount("#app");
