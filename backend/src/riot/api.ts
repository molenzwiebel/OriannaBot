import Teemo = require("teemojs");

export const REGIONS = ["BR", "EUNE", "EUW", "JP", "LAN", "LAS", "NA", "OCE", "TR", "RU", "KR", "PH", "SG", "TH", "TW", "VN", "ME"];

/**
 * A simple incomplete interface for the Riot Games API.
 * This only contains methods used in Orianna, and supports all platforms and rate limiting.
 */
export default class RiotAPI {
    private readonly teemo: teemo.Teemo;

    constructor(lolKey: string, scale: number) {
        this.teemo = Teemo(lolKey, {
            distFactor: scale
        });
    }

    /**
     * @returns the riot account for the given gamename and tagline, or null if they don't exist
     */
    async getRiotAccountByName(gamename: string, tagline: string): Promise<riot.RiotAccount | null> {
        try {
            return await this.teemo.get(randomAccountShard(), "account.getByRiotId", gamename, tagline);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the summoner for the specified puuid in the specified region, or null if not found
     */
    async getSummonerByPUUID(region: string, puuid: string): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region), "summoner.getByPUUID", puuid);
        } catch (e) {
            return null;
        }
    }
}

/**
 * @returns a random account-v1 shard to make a request to. Over a longer period of
 * time, this should evenly distribute the load and rate limits
 */
function randomAccountShard(): string {
    return ["americas", "asia", "europe"][Math.floor(Math.random() * 3)];
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
        "ru": "RU",
        "ph": "PH2",
        "sg": "SG2",
        "th": "TH2",
        "tw": "TW2",
        "vn": "VN2",
        "me": "ME1",
    })[region.toLowerCase()];
}