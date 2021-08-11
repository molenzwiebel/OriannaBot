import { Translator } from "./i18n";
import callsites from "callsites";
import { wrapCallSite } from "source-map-support";
import * as path from "path";
import debug = require("debug");

interface Configuration {
    riot: {
        lolApiKey: string;
        tftApiKey: string;
        tiers: string[];
        rankedQueueTranslationKeys: { [key: string]: keyof Translator };
    };
    discord: {
        proxyHost: string;
        clientId: string;
        clientSecret: string;
        owner: string;
        token: string;
        emoteServers: string[];
    };
    reddit: {
        clientId: string;
        clientSecret: string;
    };
    web: {
        url: string;
        port: number;
        apiKey: string;
    };
    dissonance: {
        amqpHost: string;
        exchange: string;
        queue: string;
    };
    redis: {
        host: string;
        port: number;
    };
    shockwave: {
        url: string;
    };
    flags?: {
        enableButtons?: boolean;
    };
    badges: { [key: string]: {
        small: string;
        big: string;
    } };
    db: any;
    ffmpeg: string;
    dblToken: string;
    traceLogLines: boolean;
}

const config: Configuration = require("../config.json");
export default config;

if (config.traceLogLines) {
    const orig = (debug as any).formatArgs;
    (debug as any).formatArgs = function (args: any) {
        const callsite = callsites();
        const relevantCallsite = wrapCallSite(callsite[2]);
        const relativePath = path.relative(path.join(__dirname, ".."), relevantCallsite.getFileName()).replace(/\\/g, "/");

        args[0] = `${relativePath}:${relevantCallsite.getLineNumber()} - ${args[0]}`;

        // call original implementation
        orig.call(this, args);
    };
}