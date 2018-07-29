import Vue from "vue";
import VueRouter from "vue-router";
import VueFormWizard from "vue-form-wizard";
import VueTippy from "vue-tippy";
import VueTextMask from "vue-text-mask";
import VueSimpleSuggest = require("vue-simple-suggest/dist/cjs");

import "./common.styl";
import "vue-form-wizard/dist/vue-form-wizard.min.css";

import App from "./components/app/app.vue";
import Home from "./components/home/home.vue";
import UserProfile from "./components/profile/profile.vue";
import ServerProfile from "./components/server/server.vue";
import Tree from "./components/role-tree/tree.vue";
import ServerIntro from "./components/server-intro/server-intro.vue";
import IntroMains from "./components/server-intro/intro-mains.vue";
import IntroGeneric from "./components/server-intro/intro-generic.vue";
import Error from "./components/error/error.vue";
import { API_HOST } from "./config";

Vue.component("masked-input", VueTextMask);
Vue.component("vue-suggest", VueSimpleSuggest);
Vue.use(VueTippy);
Vue.use(VueRouter);
Vue.use(VueFormWizard);

const router = new VueRouter({
    mode: ENV === "prod" ? "history" : "hash",
    routes: [
        { path: "/", component: Home },
        { path: "/docs", component: Tree },
        { path: "/invite", beforeEnter: () => location.href = API_HOST + "/api/v1/discord-invite" },
        { path: "/me", component: UserProfile },
        { path: "/server/:id", component: ServerProfile },
        { path: "/server/:id/intro", component: ServerIntro },
        { path: "/server/:id/intro/main", component: IntroMains },
        { path: "/server/:id/intro/generic", component: IntroGeneric },

        // Login failed route.
        { path: "/login-fail", component: Error, props: { title: "Login Failed", details: "The key you tried to use to authenticate either doesn't exist or has expired. Request a new one using @Orianna Bot edit or login using Discord below.", showLogin: true } },

        // 404 Route
        { path: "*", component: Error, props: { title: "Not Found", details: "Looks like the page you requested does not exist. Double-check your URL for spelling mistakes.", showLogin: false } },
    ]
});

new App({
    router
}).$mount("#root");

console.log("[+] Started app with environment " + ENV);