
declare namespace teemo {
    class Teemo {
        get(region: string, method: "summoner.getBySummonerName", name: string): Promise<riot.Summoner | null>;
        get(region: string, method: "summoner.getBySummonerId", id: string): Promise<riot.Summoner | null>;
        get(region: string, method: "championMastery.getAllChampionMasteries", id: string): Promise<riot.ChampionMasteryInfo[]>;
        get(region: string, method: "league.getAllLeaguePositionsForSummoner", id: string): Promise<riot.LeagueEntry[]>;
        get(region: string, method: "thirdPartyCode.getThirdPartyCodeBySummonerId", id: string): Promise<string>;
        get(region: string, method: "match.getMatchlist", accountId: string, opts?: {
            beginIndex?: number
        }): Promise<{ matches: riot.MatchEntry[] }>;
    }
}

declare module "teemojs" {
    function create(apiKey: string, options?: {
        distFactor?: number
    }): teemo.Teemo;
    export = create;
}