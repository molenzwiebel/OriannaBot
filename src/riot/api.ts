import { RateLimiter } from "limiter";
import request = require("request-promise");

/**
 * A simple incomplete interface for the Riot Games API.
 * This only contains methods used in Orianna, and supports all platforms and rate limiting.
 */
export default class RiotAPI {
    // Rate limits for production key.
    private perTenSec = new RateLimiter(3000, 1000 * 10);
    private perTenMin = new RateLimiter(180000, 1000 * 10 * 60);
    private readonly apiKey: string;

    constructor(key: string) {
        this.apiKey = key;
    }

    /**
     * @returns information about the specified summoner, or undefined if they do not exist.
     */
    async getSummonerByName(region: string, name: string): Promise<riot.Summoner | undefined> {
        region = region.toLowerCase();
        await this.rateLimit();

        try {
            return JSON.parse(await request.get({
                url: `https://${platform(region)}.api.riotgames.com/lol/summoner/v3/summoners/by-name/${encodeURIComponent(name)}?api_key=${this.apiKey}`
            }));
        } catch (e) {
            return;
        }
    }

    /**
     * @returns information about the specified summoner, or undefined if they do not exist.
     */
    async getSummonerById(region: string, summonerId: number): Promise<riot.Summoner | undefined> {
        region = region.toLowerCase();
        await this.rateLimit();

        try {
            return JSON.parse(await request.get({
                url: `https://${platform(region)}.api.riotgames.com/lol/summoner/v3/summoners/${summonerId}?api_key=${this.apiKey}`
            }));
        } catch (e) {
            return;
        }
    }

    /**
     * @returns the rune pages for the specified summoner id
     */
    async getSummonerRunes(region: string, summonerId: number): Promise<riot.RunePages> {
        region = region.toLowerCase();
        await this.rateLimit();

        return JSON.parse(await request.get({
            url: `https://${platform(region)}.api.riotgames.com/lol/platform/v3/runes/by-summoner/${summonerId}?api_key=${this.apiKey}`
        }));
    }

    /**
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: number): Promise<riot.ChampionMasteryInfo[]> {
        region = region.toLowerCase();
        await this.rateLimit();

        return JSON.parse(await request.get({
            url: `https://${platform(region)}.api.riotgames.com/lol/champion-mastery/v3/champion-masteries/by-summoner/${summonerId}?api_key=${this.apiKey}`
        }));
    }

    /**
     * @returns static champion data, in an { id: data } format.
     */
    async getStaticChampionData(region: string): Promise<{ data: riot.ChampionData, version: string }> {
        region = region.toLowerCase();

        return JSON.parse(await request.get({
            url: `https://${platform(region)}.api.riotgames.com/lol/static-data/v3/champions?dataById=true&api_key=${this.apiKey}`
        }));
    }

    /**
     * @returns a promise that resolves when a request can be made.
     */
    private async rateLimit(): Promise<void> {
        return new Promise<void>(resolve => {
            this.perTenSec.removeTokens(1, () => {
                this.perTenMin.removeTokens(1, () => resolve());
            });
        });
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