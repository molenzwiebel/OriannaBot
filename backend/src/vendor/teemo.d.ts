
declare namespace teemo {
    class Teemo {
        get(region: string, method: "summoner.getBySummonerName", name: string): Promise<riot.Summoner | null>;
        get(region: string, method: "summoner.getBySummonerId", id: string): Promise<riot.Summoner | null>;
        get(region: string, method: "championMastery.getAllChampionMasteries", id: string): Promise<riot.ChampionMasteryInfo[]>;
        get(region: string, method: "lolStaticData.getChampionList"): Promise<{ data: riot.ChampionData, version: string }>;
        get(region: string, method: "league.getAllLeaguePositionsForSummoner", id: string): Promise<riot.LeagueEntry[]>;
    }
}

declare module "teemojs" {
    function create(apiKey: string): teemo.Teemo;
    export = create;
}