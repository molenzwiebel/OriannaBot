import Vue from "vue";
import VueRouter from "vue-router";
import VueFormWizard from "vue-form-wizard";

import "./common.styl";
import "vue-form-wizard/dist/vue-form-wizard.min.css";

import App from "./components/app/app.vue";
import UserProfile from "./components/profile/profile.vue";
import ServerProfile from "./components/server/server.vue";
import DocsComponent from "./components/docs/docs.vue";
import Error from "./components/error/error.vue";

Vue.use(VueRouter);
Vue.use(VueFormWizard);

const router = new VueRouter({
    routes: [
        { path: "/", component: { render(x) { return x("p") } } },
        { path: "/docs", component: DocsComponent },
        { path: "/me", component: UserProfile },
        { path: "/server/:id", component: ServerProfile },

        // 404 Route
        { path: "*", component: Error, props: { title: "Not Found", details: "Looks like the page you requested does not exist. Double-check your URL for spelling mistakes.", showLogin: false } }
    ]
});

new App({
    router
}).$mount("#root");