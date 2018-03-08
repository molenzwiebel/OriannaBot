import Vue from "vue";
import VueRouter from "vue-router";

import App from "./components/app/app.vue";

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        { path: "/", component: { render(x) { return x("p") } } },
        { path: "/docs", component: { render(x) { return x("i") } } },
        { path: "/invite", component: { render(x) { return x("div") } } }
    ]
});

new App({
    router
}).$mount("#root");