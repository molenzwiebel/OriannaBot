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
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: number): Promise<riot.ChampionMasteryInfo[]> {
        try {
            return await this.teemo.get(platform(region), "championMastery.getChampionMastery", "" + summonerId);
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