// This file contains incomplete definitions for Riot API DTO's.
declare namespace riot {
    export interface Summoner {
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
        skins: { num: number, parentSkin?: number }[];
        tags: string[];
    }
}