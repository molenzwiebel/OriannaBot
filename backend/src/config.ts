
interface Configuration {
    riot: {
        apiKey: string;
        tiers: string[];
    };
    discord: {
        owner: string;
        token: string;
        emoteServers: string[];
    };
    web: {
        url: string;
    };
}

const config: Configuration = require("../config.json");
export default config;