import Teemo = require("teemojs");

export const REGIONS = ["BR", "EUNE", "EUW", "JP", "LAN", "LAS", "NA", "OCE", "TR", "RU", "KR"];

/**
 * A simple incomplete interface for the Riot Games API.
 * This only contains methods used in Orianna, and supports all platforms and rate limiting.
 */
export default class RiotAPI {
    private readonly lolTeemo: teemo.Teemo;
    private readonly tftTeemo: teemo.Teemo;

    constructor(lolKey: string, tftKey: string, scale: number) {
        this.lolTeemo = Teemo(lolKey, {
            distFactor: scale
        });

        this.tftTeemo = Teemo(tftKey, {
            distFactor: scale
        });
    }

    /**
     * @returns the summoner for the specified name in the specified region, or null if not found
     */
    async getLoLSummonerByName(region: string, name: string): Promise<riot.Summoner | null> {
        try {
            return await this.lolTeemo.get(platform(region), "summoner.getBySummonerName", name);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the summoner for the specified summoner id in the specified region, or null if not found
     */
    async getLoLSummonerById(region: string, summonerId: string): Promise<riot.Summoner | null> {
        return this.lolTeemo.get(platform(region), "summoner.getBySummonerId", "" + summonerId);
    }

    /**
     * @returns the summoner for the specified name in the specified region, or null if not found
     */
    async getTFTSummonerByName(region: string, name: string): Promise<riot.Summoner | null> {
        try {
            return await this.tftTeemo.get(platform(region), "tftSummoner.getBySummonerName", name);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the summoner for the specified summoner id in the specified region, or null if not found
     */
    async getTFTSummonerById(region: string, summonerId: string): Promise<riot.Summoner | null> {
        return this.tftTeemo.get(platform(region), "tftSummoner.getBySummonerId", "" + summonerId);
    }

    /**
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: string): Promise<riot.ChampionMasteryInfo[]> {
        return this.lolTeemo.get(platform(region), "championMastery.getAllChampionMasteries", summonerId);
    }

    /**
     * @returns all the league positions for the specified summoner id
     */
    async getLoLLeaguePositions(region: string, summonerId: string): Promise<riot.LeagueEntry[]> {
        return this.lolTeemo.get(platform(region), "league.getLeagueEntriesForSummoner", summonerId);
    }

    /**
     * @returns all the league positions for the specified summoner id
     */
    async getTFTLeaguePositions(region: string, summonerId: string): Promise<riot.LeagueEntry[]> {
        return this.tftTeemo.get(platform(region), "tftLeague.getLeagueEntriesForSummoner", summonerId);
    }

    /**
     * Checks if the specified summoner has the specified code as their third party code.
     */
    async isThirdPartyCode(region: string, summonerId: string, code: string): Promise<boolean> {
        try {
            const currentCode = await this.lolTeemo.get(platform(region), "thirdPartyCode.getThirdPartyCodeBySummonerId", "" + summonerId);
            return currentCode.toLowerCase() === code.toLowerCase();
        } catch (e) {
            return false;
        }
    }
}

/**
 * @returns the platform ID for the specified region
 */
export function platform(region: string): string {
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