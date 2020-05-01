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

import Docs from "./components/docs/docs.vue";
import CommandDocs from "./components/docs/commands.vue";
import LinkDocs from "./components/docs/link.vue";
import SetupDocs from "./components/docs/setup.vue";
import ConditionDocs from "./components/docs/conditions.vue";

import Privacy from "./components/privacy/privacy.vue";

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

// Redirect old ori v1 player auth to the new link.
// Note that this doesn't check for hash validity, that is the job of the api endpoint.
if (window.location.hash.indexOf("player") !== -1) {
    const match = /player\/(.*)$/.exec(window.location.hash);
    if (match) window.location.href = "/login/" + match[1];
}

const router = new VueRouter({
    mode: ENV === "prod" ? "history" : "hash",
    routes: [
        { path: "/", component: Home },

        { path: "/docs", component: Docs },
        { path: "/docs/commands", component: CommandDocs },
        { path: "/docs/link", component: LinkDocs },
        { path: "/docs/setup", component: SetupDocs },
        { path: "/docs/conditions", component: ConditionDocs },

        { path: "/privacy", component: Privacy },

        { path: "/invite", beforeEnter: () => location.href = API_HOST + "/api/v1/discord-invite" },
        { path: "/me", component: UserProfile },
        { path: "/server/:id", component: ServerProfile },
        { path: "/server/:id/intro", component: ServerIntro },
        { path: "/server/:id/intro/main", component: IntroMains },
        { path: "/server/:id/intro/generic", component: IntroGeneric },

        // Login failed route.
        { path: "/login-fail", component: Error, props: { title: "Login Failed", details: "The key you tried to use to authenticate either doesn't exist or has expired. Request a new one using @Orianna Bot edit or login using Discord below.", showLogin: true } },

        // Outdated route.
        { path: "/outdated-link", component: Error, props: { title: "Outdated Link", details: "You tried to use a server configuration link generated with an older version of Orianna Bot. These links are no longer valid. To configure your server, simply login below and select the appropriate server from the sidebar.", showLogin: true } },

        // 404 Route
        { path: "*", component: Error, props: { title: "Not Found", details: "Looks like the page you requested does not exist. Double-check your URL for spelling mistakes.", showLogin: false } },
    ]
});

// Redirect ori v1 server links.
if (/(setup|configure)\/(.*)$/.test(window.location.hash)) {
    router.push("/outdated-link");
}

new App({
    router
}).$mount("#root");

console.log("[+] Started app with environment " + ENV);