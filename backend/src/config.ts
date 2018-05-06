
interface Configuration {
    riot: {
        apiKey: string;
        tiers: string[];
        rankedQueues: { [key: string]: string };
    };
    discord: {
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
    };
    ffmpeg: string;
}

const config: Configuration = require("../config.json");
export default config;