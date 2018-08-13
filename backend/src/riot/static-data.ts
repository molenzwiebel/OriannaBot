import fetch from "node-fetch";
import { LeagueAccount } from "../database";

const ABBREVIATIONS: { [key: string]: string } = {
    "mumu": "Amumu",
    "ali": "Alistar",
    "sol": "AurelionSol",
    "aurelion": "AurelionSol",
    "asol": "AurelionSol",
    "blitz": "Blitzcrank",
    "cait": "Caitlyn",
    "cass": "Cassiopeia",
    "cho": "ChoGath",
    "mundo": "DrMundo",
    "eve": "Evelynn",
    "ez": "Ezreal",
    "fiddle": "Fiddlesticks",
    "fish": "Fizz",
    "gp": "Gangplank",
    "heca": "Hecarim",
    "heim": "Heimerdinger",
    "heimer": "Heimerdinger",
    "j4": "JarvanIV",
    "jarvan": "JarvanIV",
    "jarvan 4": "JarvanIV",
    "kass": "Kassadin",
    "kassa": "Kassadin",
    "kat": "Katarina",
    "kata": "Katarina",
    "kha": "Khazix",
    "kog": "KogMaw",
    "lb": "Leblanc",
    "lee": "LeeSin",
    "leo": "Leona",
    "liss": "Lissandra",
    "luc": "Lucian",
    "malph": "Malphite",
    "malz": "Malzahar",
    "mao": "Maokai",
    "yi": "MasterYi",
    "mf": "MissFortune",
    "morde": "Mordekaiser",
    "hue": "Mordekaiser", // :^)
    "morg": "Morgana",
    "naut": "Nautilus",
    "nauti": "Nautilus",
    "nid": "Nidalee",
    "nida": "Nidalee",
    "noc": "Nocturne",
    "noct": "Nocturne",
    "ori": "Orianna",
    "waifu": "Orianna", // :^)
    "ball": "Orianna", // :^)
    "panth": "Pantheon",
    "rek": "RekSai",
    "renek": "Renekton",
    "croc": "Renekton",
    "reng": "Rengar",
    "rengo": "Rengar",
    "cat": "Rengar", // :^)
    "sej": "Sejuani",
    "seju": "Sejuani",
    "shy": "Shyvana",
    "shyv": "Shyvana",
    "raka": "Soraka",
    "balls": "Syndra", // :^)
    "tahm": "TahmKench",
    "tali": "Taliyah",
    "teeto": "Teemo",
    "devil": "Teemo", // :^)
    "satan": "Teemo", // :^)
    "trist": "Tristana",
    "trund": "Trundle",
    "trynd": "Tryndamere",
    "tf": "TwistedFate",
    "rat": "Twitch", // :^)
    "dyr": "Udyr",
    "veig": "Veigar",
    "vel": "VelKoz",
    "vik": "Viktor",
    "vlad": "Vladimir",
    "voli": "Volibear",
    "ww": "Warwick",
    "wuk": "MonkeyKing",
    "xer": "Xerath",
    "xin": "XinZhao",
    "yas": "Yasuo",
    "zil": "Zilean"
};

/**
 * Simple class that manages static league data, such as champion
 * data and URLs to images.
 */
class StaticData {
    private data: riot.Champion[];
    private version: string;
    private dataPromise = this.fetchData();

    /**
     * Tries to find a champion name in the specified string. Returns
     * null if no champion could be find, returns the champion otherwise.
     */
    public async findChampion(content: string) {
        const normalized = content.toLowerCase().replace(/\W/g, "");

        // Try normal names first.
        const valid = [];
        for (const champ of this.data) {
            if (normalized.includes(champ.name.toLowerCase().replace(/\W/g, ""))) {
                valid.push(champ);
            }
        }

        // If we had a valid full match, go for the longest name (to prevent Viktor from returning Vi for example).
        if (valid.length) {
            return valid.sort((a, b) => b.name.length - a.name.length)[0];
        }

        // If that doesn't work, try abbreviations.
        const words = content.toLowerCase().split(" ");
        for (const abbrev of Object.keys(ABBREVIATIONS)) {
            if (words.includes(abbrev)) {
                return this.championByInternalName(ABBREVIATIONS[abbrev]);
            }
        }

        return null;
    }

    /**
     * Finds the champion with the specified name.
     */
    public async championByName(name: string) {
        await this.dataPromise;
        return this.data.find(x => x.name === name)!;
    }

    /**
     * Finds the champion with the specified internal name (MonkeyKing, not Wukong).
     */
    public async championByInternalName(name: string) {
        await this.dataPromise;
        return this.data.find(x => x.id === name)!;
    }

    /**
     * Finds the champion with the specified numeric id.
     */
    public async championById(id: number | string) {
        await this.dataPromise;
        return this.data.find(x => x.key == id)!;
    }

    /**
     * Returns a URL for the icon for the specified champion or champion id.
     */
    public async getChampionIcon(champion: riot.Champion | number) {
        if (typeof champion === "number") champion = await this.championById(champion);

        await this.dataPromise;
        return `https://ddragon.leagueoflegends.com/cdn/${this.version}/img/champion/${champion.id}.png`;
    }

    /**
     * Returns a URL for a random centered splash for one of the skins of the specified champion.
     */
    public async getRandomCenteredSplash(champion: riot.Champion | number) {
        if (typeof champion === "number") champion = await this.championById(champion);

        await this.dataPromise;
        const skin = champion.skins[Math.floor(Math.random() * champion.skins.length)];

        return `https://cdn.communitydragon.org/latest/champion/${champion.key}/splash-art/centered/skin/${skin.num}`;
    }

    /**
     * Returns a URL for the summoner icon for the specified LeagueAccount.
     */
    public async getUserIcon(account: LeagueAccount) {
        return `https://avatar.leagueoflegends.com/${account.region}/${encodeURIComponent(account.username)}.png`;
    }

    /**
     * Loads the champion data if it is not already loaded.
     */
    private async fetchData() {
        const versionReq = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionReq.json();

        const dataReq = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/championFull.json`);
        const data = await dataReq.json();

        this.version = data.version;
        this.data = Object.values(data.data);
    }
}
export default new StaticData();