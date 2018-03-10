import Vue from "vue";
import VueRouter from "vue-router";

import "./common.styl";

import App from "./components/app/app.vue";
import UserProfile from "./components/profile/profile.vue";
import Error from "./components/error/error.vue";

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        { path: "/", component: { render(x) { return x("p") } } },
        { path: "/docs", component: { render(x) { return x("i") } } },
        { path: "/invite", component: { render(x) { return x("div") } } },
        { path: "/me", component: UserProfile },

        // 404 Route
        { path: "*", component: Error, props: { title: "Not Found", details: "Looks like the page you requested does not exist. Double-check your URL for spelling mistakes.", showLogin: false } }
    ]
});

new App({
    router
}).$mount("#root");