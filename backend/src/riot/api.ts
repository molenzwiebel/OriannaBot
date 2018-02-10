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
     * @returns the summoner for the specified name in the specified region, or null if not found
     */
    async getSummonerByName(region: string, name: string): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region), "summoner.getBySummonerName", encodeURIComponent(name));
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the summoner for the specified summoner id in the specified region, or null if not found
     */
    async getSummonerById(region: string, summonerId: number): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region), "summoner.getBySummonerId", "" + summonerId);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: number): Promise<riot.ChampionMasteryInfo[]> {
        try {
            return await this.teemo.get(platform(region), "championMastery.getAllChampionMasteries", "" + summonerId);
        } catch (e) {
            return [];
        }
    }

    /**
     * @returns all the league positions for the specified summoner id
     */
    async getLeaguePositions(region: string, summonerId: number): Promise<riot.LeagueEntry[]> {
        try {
            return await this.teemo.get(platform(region), "league.getAllLeaguePositionsForSummoner", "" + summonerId);
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
    })[region.toLowerCase()];
}