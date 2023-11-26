
declare namespace teemo {
    class Teemo {
        get(platform: string, method: "account.getByRiotId", gamename: string, tagline: string): Promise<riot.RiotAccount | null>;
        get(region: string, method: "summoner.getByPUUID", puuid: string): Promise<riot.Summoner | null>;

        config: {
            endpoints: { [key: string]: { [key: string]: string }; };
        };
    }
}

declare module "teemojs" {
    function create(apiKey: string, options?: {
        distFactor?: number
    }): teemo.Teemo;
    export = create;
}