declare module "*.vue" {
    import Vue from "vue";
    export default Vue;
}

declare const twemoji: {
    parse: (content: string) => string
};