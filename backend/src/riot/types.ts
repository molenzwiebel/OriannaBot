// This file contains incomplete definitions for Riot API DTO's.
namespace riot {
    export interface Summoner {
        name: string;
        id: number;
        accountId: number;
        profileIconId: number;
    }

    export interface ChampionMasteryInfo {
        championPoints: number;
        championId: number;
    }

    export interface ChampionData {
        [key: number]: {
            id: number;
            key: string;
            name: string;
        };
    }

    export interface LeagueEntry {
        queueType: string;
        tier: string;
    }
}