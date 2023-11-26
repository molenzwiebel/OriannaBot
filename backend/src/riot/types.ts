// This file contains incomplete definitions for Riot API DTO's.
namespace riot {
    export interface Summoner {
        name: string;
        id: string;
        accountId: string;
        puuid: string;
        profileIconId: number;
    }

    export interface RiotAccount {
        puuid: string;
        gameName: string;
        tagLine: string;
    }

    export interface Champion {
        id: string;
        key: string;
        name: string;
        title: string;
        skins: { num: number }[];
        tags: string[];
    }
}