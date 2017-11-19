import Teemo = require("teemojs");

/**
 * A simple incomplete interface for the Riot Games API.
 * This only contains methods used in Orianna, and supports all platforms and rate limiting.
 */
export default class RiotAPI {
    private readonly teemo: teemo.Teemo;

    constructor(key: string) {
        this.teemo = Teemo(key);
    }

    /**
     * @returns information about the specified summoner, or undefined if they do not exist.
     */
    async getSummonerByName(region: string, name: string): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region.toLowerCase()), "summoner.getBySummonerName", encodeURIComponent(name));
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns information about the specified summoner, or undefined if they do not exist.
     */
    async getSummonerById(region: string, summonerId: number): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region.toLowerCase()), "summoner.getBySummonerId", "" + summonerId);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: number): Promise<riot.ChampionMasteryInfo[]> {
        try {
            return await this.teemo.get(platform(region.toLowerCase()), "championMastery.getChampionMastery", "" + summonerId);
        } catch (e) {
            return [];
        }
    }

    /**
     * @returns static champion data, in an { id: data } format.
     */
    async getStaticChampionData(region: string): Promise<{ data: riot.ChampionData, version: string }> {
        return this.teemo.get(platform(region.toLowerCase()), "lolStaticData.getChampionList");
    }

    /**
     * @returns all the leagues for the specified user, or an empty array if they aren't placed currently
     */
    async getLeagues(region: string, summonerId: number): Promise<riot.LeagueEntry[]> {
        try {
            return await this.teemo.get(platform(region.toLowerCase()), "league.getAllLeaguePositionsForSummoner", "" + summonerId);
        } catch (e) {
            return [];
        }
    }
}

/**
 * @returns the platform ID for the specified region
 */
function platform(region: string): string {
    return (<{ [key: string]: string }>{
        "br": "BR1",
        "eune": "EUN1",
        "euw": "EUW1",
        "jp": "JP1",
        "kr": "KR",
        "lan": "LA1",
        "las": "LA2",
        "na": "NA1",
        "oce": "OC1",
        "tr": "TR1",
        "ru": "RU"
    })[region];
}