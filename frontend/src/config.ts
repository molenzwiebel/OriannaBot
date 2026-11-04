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

    // Classic champions are listed in a separate file.
    const base = "https://ddragon.leagueoflegends.com/cdn/" + versions[0] + "/data/en_US/";
    const [data, classicData] = await Promise.all([
        fetch(base + "champion.json").then(x => x.json()).then(x => x.data),
        fetch(base + "mode/classic/champion.json").then(x => x.json()).then(x => x.data)
    ]);

    return _champions = [
        ...Object.keys(data).map(x => data[x]),
        ...Object.keys(classicData).map(x => classicData[x])
    ];
}

export const CLASSIC_ID_PREFIX = "Jade_";

/**
 * Returns the URL of the icon of the specified champion.
 */
export function championIcon(champion: Champion) {
    const folder = champion.id.startsWith(CLASSIC_ID_PREFIX) ? "/img/mode/classic/champion/" : "/img/champion/";
    return "https://ddragon.leagueoflegends.com/cdn/" + ddragon() + folder + champion.id + ".png";
}

export const API_HOST = "https://orianna.molenzwiebel.xyz";