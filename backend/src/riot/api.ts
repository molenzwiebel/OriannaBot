import Teemo = require("teemojs");
import config from "../config";

export const REGIONS = ["BR", "EUNE", "EUW", "JP", "LAN", "LAS", "NA", "OCE", "TR", "RU"];

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
            return await this.teemo.get(platform(region), "summoner.getBySummonerName", name);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the summoner for the specified summoner id in the specified region, or null if not found
     */
    async getSummonerById(region: string, summonerId: string): Promise<riot.Summoner | null> {
        try {
            return await this.teemo.get(platform(region), "summoner.getBySummonerId", "" + summonerId);
        } catch (e) {
            return null;
        }
    }

    /**
     * @returns the champion mastery for the specified summoner id
     */
    async getChampionMastery(region: string, summonerId: string): Promise<riot.ChampionMasteryInfo[]> {
        try {
            return await this.teemo.get(platform(region), "championMastery.getAllChampionMasteries", "" + summonerId);
        } catch (e) {
            return [];
        }
    }

    /**
     * @returns all the league positions for the specified summoner id
     */
    async getLeaguePositions(region: string, summonerId: string): Promise<riot.LeagueEntry[]> {
        try {
            return await this.teemo.get(platform(region), "league.getAllLeaguePositionsForSummoner", "" + summonerId);
        } catch (e) {
            return [];
        }
    }

    /**
     * Checks if the specified summoner has the specified code as their third party code.
     */
    async isThirdPartyCode(region: string, summonerId: string, code: string): Promise<boolean> {
        try {
            const currentCode = await this.teemo.get(platform(region), "thirdPartyCode.getThirdPartyCodeBySummonerId", "" + summonerId);
            return currentCode.toLowerCase() === code.toLowerCase();
        } catch (e) {
            return false;
        }
    }

    /**
     * Finds all the ranked games for the specified account that were played after the
     * specified timestamp. Games are determined to be ranked based on the settings in
     * the config. Note that this returns an array with the most recent game in index 0.
     */
    async findRankedGamesAfter(region: string, accountId: string, timestamp: number): Promise<riot.MatchEntry[]> {
        const rankedGames = [];
        const minSeason = Math.min(...config.riot.rankedGameCountSeasons);

        for (let i = 0; true; i += 100) {
            // Load games 100 at a time until we have all games.
            const games = await this.teemo.get(platform(region), "match.getMatchlist", "" + accountId, {
                beginIndex: i
            });

            if (!games.matches.length) return rankedGames;
            for (const game of games.matches) {
                // If we only have stale games left, stop.
                if (game.timestamp < timestamp || game.season < minSeason) return rankedGames;

                // If this is a valid game, add it to the list.
                if (config.riot.rankedGameCountQueues.includes(game.queue) && config.riot.rankedGameCountSeasons.includes(game.season)) {
                    rankedGames.push(game);
                }
            }
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