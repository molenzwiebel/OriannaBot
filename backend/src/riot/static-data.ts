import fetch from "node-fetch";

// Classic champions have the id of the normal champion with this prefix, and the key of the
// normal champion plus this offset.
const CLASSIC_ID_PREFIX = "Jade_";
const CLASSIC_KEY_OFFSET = 60000;

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
    "feet": "Briar", // :^)
    "fiddle": "Fiddlesticks",
    "fondlesticks": "Fiddlesticks",
    "fish": "Fizz",
    "gp": "Gangplank",
    "glasc": "Renata",
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
    "renata": "Renata",
    "renek": "Renekton",
    "croc": "Renekton",
    "reng": "Rengar",
    "rengo": "Rengar",
    "cat": "Rengar", // :^)
    "sej": "Sejuani",
    "seju": "Sejuani",
    "sera": "Seraphine",
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
    "yummi": "Yuumi",
    "zil": "Zilean"
};

/**
 * Simple class that manages static league data, such as champion
 * data and URLs to images.
 */
export default class StaticData {
    private data!: riot.Champion[];
    private version!: string;
    private dataPromise: Promise<void>;

    constructor(private language: string) {
        this.dataPromise = this.fetchData();
    }

    /**
     * Loads the champion data again if DDragon has a newer version. Calls
     * that run before the load finishes use the old data.
     */
    public async reload() {
        const version = await fetchLatestVersion();
        if (version === this.version) return;

        await this.fetchData(version);
        this.dataPromise = Promise.resolve();
    }

    /**
     * Return the full list of all champions for this static data instance.
     */
    public async getAllChampions(): Promise<riot.Champion[]> {
        await this.dataPromise;
        return this.data;
    }

    /**
     * Tries to find a champion name in the specified string. Returns
     * null if no champion could be found, returns the champion otherwise.
     */
    public async findChampion(content: string) {
        const normalized = content.toLowerCase().replace(/['`\s".&]/g, "");
        const classic = content.toLowerCase().includes("classic");

        // Try normal names first.
        const valid = [];
        for (const champ of this.data) {
            // skip classic champs unless the user explicitly requested them
            if (isClassicChampion(champ) !== classic) continue;

            if (normalized.includes(this.baseChampion(champ).name.toLowerCase().replace(/['`\s".&]/g, ""))) {
                valid.push(champ);
            }
        }

        // If we had a valid full match, go for the longest name (to prevent Viktor from returning Vi for example).
        if (valid.length) {
            // Give a bonus to names that appear standalone (prefer **Jax** progression over jax progres*sion*).
            const computeValue = (x: string) => x.length + (new RegExp("\\b" + x + "\\b", "i").test(content) ? 1000 : 0);

            return valid.sort((a, b) => computeValue(this.baseChampion(b).name) - computeValue(this.baseChampion(a).name))[0];
        }

        // If that doesn't work, try abbreviations.
        const words = content.toLowerCase().split(" ");
        for (const abbrev of Object.keys(ABBREVIATIONS)) {
            if (words.includes(abbrev)) {
                if (classic) {
                    return this.championByInternalName(CLASSIC_ID_PREFIX + ABBREVIATIONS[abbrev]) ?? null;
                }

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
     * Returns the normal champion for a classic champion, or the champion itself if it isn't classic.
     * This will crash if data has not yet been loaded.
     */
    public baseChampion(champion: riot.Champion): riot.Champion {
        return isClassicChampion(champion) ? this.championByInternalNameSync(champion.id.slice(CLASSIC_ID_PREFIX.length)) : champion;
    }

    /**
     * Finds the champion with the specified numeric id.
     */
    public async championById(id: number | string) {
        await this.dataPromise;
        return this.data.find(x => x.key == id)!;
    }

    /**
     * Returns a URL for the icon for the specified champion or champion id. A classic
     * champion uses the icon of the normal champion.
     */
    public async getChampionIcon(champion: riot.Champion | number) {
        if (typeof champion === "number") champion = await this.championById(champion);

        await this.dataPromise;
        return `https://ddragon.leagueoflegends.com/cdn/${this.version}/img/champion/${this.baseChampion(champion).id}.png`;
    }

    /**
     * Returns a URL for the splash art for the specified champion or champion id. A classic
     * champion uses the splash art of the normal champion.
     */
    public async getChampionSplash(champion: riot.Champion | number) {
        if (typeof champion === "number") champion = await this.championById(champion);

        await this.dataPromise;
        return `http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${this.baseChampion(champion).id}_0.jpg`;
    }

    /**
     * Returns a URL for a random centered splash for one of the skins of the specified champion.
     * A classic champion uses the skins of the normal champion.
     */
    public async getRandomCenteredSplash(champion: riot.Champion | number) {
        if (typeof champion === "number") champion = await this.championById(champion);

        await this.dataPromise;
        const base = this.baseChampion(champion);
        const skin = base.skins[Math.floor(Math.random() * base.skins.length)];

        return `https://cdn.communitydragon.org/latest/champion/${base.key}/splash-art/centered/skin/${skin.num}`;
    }

    /**
     * Loads the champion data for the specified DDragon version, or the latest version if not specified.
     */
    private async fetchData(version?: string) {
        if (!version) version = await fetchLatestVersion();

        const dataReq = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/${this.language}/championFull.json`);
        const data = await dataReq.json();

        this.version = data.version;

        // DDragon doesn't list classic champions, but the mastery API returns them with the id of
        // the normal champion plus CLASSIC_KEY_OFFSET. Add a classic copy of every champion for them.
        const champions: riot.Champion[] = Object.values(data.data);
        this.data = [...champions, ...champions.map(champion => ({
            ...champion,
            id: CLASSIC_ID_PREFIX + champion.id,
            key: String(CLASSIC_KEY_OFFSET + +champion.key),
            name: champion.name + " (Classic)"
        }))];
    }
}

/**
 * Returns whether the champion is a classic champion, which is a copy that StaticData adds
 * for every DDragon champion.
 */
export function isClassicChampion(champion: riot.Champion) {
    return champion.id.startsWith(CLASSIC_ID_PREFIX);
}

/**
 * Returns the newest DDragon version.
 */
async function fetchLatestVersion(): Promise<string> {
    const versionReq = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = await versionReq.json();
    return versions[0];
}
