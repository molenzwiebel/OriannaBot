
interface Configuration {
    riot: {
        apiKey: string;
        tiers: string[];
        rankedQueues: { [key: string]: string };
    };
    discord: {
        owner: string;
        token: string;
        emoteServers: string[];
    };
    web: {
        url: string;
        port: number;
    };
}

const config: Configuration = require("../config.json");
export default config;