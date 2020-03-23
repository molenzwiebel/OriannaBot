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
    return "10.6.1";
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
    const champs = await champReq.json();

    return _champions = Object.keys(champs.data).map(x => champs.data[x]);
}

export const API_HOST = "https://orianna.molenzwiebel.xyz";