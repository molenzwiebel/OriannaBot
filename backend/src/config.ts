
interface Configuration {
    riot: {
        apiKey: string;
    };
    discord: {
        owner: string;
        token: string;
    };
    web: {
        url: string;
    };
}

const config: Configuration = require("../config.json");
export default config;

/*riotApiKey: string;

    ownerSnowflake: string;
    discordToken: string;

    redditClientId: string;
    redditClientSecret: string;
    redditRedirectUrl: string;

    baseUrl: string;
    updateInterval: number;
    updateAmount: number;*/