let _ddragon: string | undefined;
export function ddragon() {
    if (_ddragon) return _ddragon;

    // Load ddragon async.
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
        .then(x => x.json())
        .then(versions => {
            _ddragon = versions[0]
        });

    // Return default until we've loaded.
    return "16.15.1";
}

export interface Champion {
    id: string;
    key: string;
    name: string;
}

let _champions: Champion[] = [];
export async function champions() {
    if (_champions.length) return _champions;

    const verReq = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = await verReq.json();
    _ddragon = versions[0]; // if we reached this earlier than the ddragon call, why not help it out?

    const champReq = await fetch("https://ddragon.leagueoflegends.com/cdn/" + versions[0] + "/data/en_US/champion.json");
    const data = (await champReq.json()).data;
    const champs: Champion[] = Object.keys(data).map(x => data[x]);

    // DDragon doesn't list classic champions, but the backend stores them with the key of the normal
    // champion plus 60000. Add a classic copy of every champion, with the id prefix that the backend uses.
    return _champions = [...champs, ...champs.map(x => ({
        id: CLASSIC_ID_PREFIX + x.id,
        key: String(60000 + +x.key),
        name: x.name
    }))];
}

export const CLASSIC_ID_PREFIX = "Jade_";

/**
 * Returns the URL of the icon of the specified champion. A classic champion uses the icon of the normal champion.
 */
export function championIcon(champion: Champion) {
    return "https://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/champion/" + champion.id.replace(CLASSIC_ID_PREFIX, "") + ".png";
}

export const API_HOST = "https://orianna.molenzwiebel.xyz";