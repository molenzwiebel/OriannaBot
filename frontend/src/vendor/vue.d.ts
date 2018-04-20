declare module "*.vue" {
    import Vue from "vue";
    export = Vue;
}

declare module "vue-form-wizard" {
    const exp: any;
    export default exp;
}

declare module "vue-tippy" {
    const exp: any;
    export default exp;
}

declare module "vue-text-mask" {
    const exp: any;
    export default exp;
}

declare module "text-mask-addons/dist/createNumberMask" {
    function create(opts: any): any;
    export default create;
}

declare module "vue-simple-suggest/dist/cjs" {
    const exp: any;
    export default exp;
}