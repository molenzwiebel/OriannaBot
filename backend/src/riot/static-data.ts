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
    "fondlesticks": "Fiddlesticks",
    "fish": "Fizz",
    "gp": "Gangplank",
    "heca": "Hecarim",
    "heim": "Heimerdinger",
    "heimer": "Heimerdinger",
    "donger": "Heimerdinger",
    "dinger": "Heimerdinger",
    "j4": "JarvanIV",
    "jarvan": "JarvanIV",
    "jarvan 4": "JarvanIV",
    "kass": "Kassadin",
    "kassa": "Kassadin",
    "kat": "Katarina",
    "kata": "Katarina",
    "kha": "Khazix",
    "kog": "KogMaw",
    "skaarl": "Kled",
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
    "nunu": "Nunu", // they're nunu & willump, alias to make it easier
    "willump": "Nunu",
    "ori": "Orianna",
    "waifu": "Orianna", // :^)
    "ball": "Orianna", // :^)
    "panth": "Pantheon",
    "valor": "Quinn",
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
    "urg": "Urgot",
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
    "yuu": "Yuumi",
    "zil": "Zilean"
};

/**
 * Simple class that manages static league data, such as champion
 * data and URLs to images.
 */
export default class StaticData {
    private data: riot.Champion[];
    private version: string;
    private dataPromise: Promise<void>;

    constructor(language: string) {
        this.dataPromise = this.fetchData(language);
    }

    /**
     * Tries to find a champion name in the specified string. Returns
     * null if no champion could be find, returns the champion otherwise.
     */
    public async findChampion(content: string) {
        const normalized = content.toLowerCase().replace(/['`\s".&]/g, "");

        // Try normal names first.
        const valid = [];
        for (const champ of this.data) {
            if (normalized.includes(champ.name.toLowerCase().replace(/['`\s".&]/g, ""))) {
                valid.push(champ);
            }
        }

        // If we had a valid full match, go for the longest name (to prevent Viktor from returning Vi for example).
        if (valid.length) {
            // Give a bonus to names that appear standalone (prefer **Jax** progression over jax progres*sion*).
            const computeValue = (x: string) => x.length + (new RegExp("\\b" + x + "\\b", "i").test(content) ? 1000 : 0);

            return valid.sort((a, b) => computeValue(b.name) - computeValue(a.name))[0];
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
     * Returns whether the current data is loaded. If it is, returns true.
     * If it is not, schedules the load and returns false.
     */
    public lazyLoad() {
        return !!this.data;
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
     * Synchronous version of championByInternalName that does not wait for data.
     * This will crash if data has not yet been loaded.
     */
    public championByInternalNameSync(name: string) {
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
     * Returns a URL for the splash art for the specified champion or champion id.
     */
    public async getChampionSplash(champion: riot.Champion | number) {
        if (typeof champion === "number") champion = await this.championById(champion);

        await this.dataPromise;
        return `http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;
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
    private async fetchData(language: string) {
        const versionReq = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionReq.json();

        const dataReq = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/${language}/championFull.json`);
        const data = await dataReq.json();

        this.version = data.version;
        this.data = Object.values(data.data);
    }
}
