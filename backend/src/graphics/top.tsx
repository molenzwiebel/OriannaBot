import { CSSProperties, Fragment, ReactNode } from "react";
import { asset, renderGraphic } from "./tools";
import { Translator } from "../i18n";

export interface TopGraphicOptions {
    champion?: riot.Champion;

    title: string;

    players: {
        championAvatar?: string;
        place: number;
        username: string;
        avatar: string;
        score: number;
        level: number;
    }[];
}

const SPLASH_OFFSETS: { [key: string]: number } = {
    Blitzcrank: 30,
    Anivia: 80,
    Kassadin: 40,
    Hecarim: -40,
    Velkoz: 100,
    Zac: 230,
    Soraka: -40,
    Jayce: 30,
    Alistar: 120,
    Leona: -60,
    Rammus: 100,
    Lissandra: -40,
    Darius: -45,
    Trundle: 30,
    TahmKench: 100,
    Kaisa: -40,
    Katarina: 110,
    Aatrox: 30,
    Gnar: 220,
    Lucian: 100,
    Ezreal: 30,
    Khazix: 90,
    Draven: 30,
    Heimerdinger: 140,
    Yasuo: 50,
    MissFortune: 40,
    Kindred: 70,
    Fiddlesticks: 50,
    Garen: 60,
    Shen: -60,
    Annie: 60,
    Quinn: 40,
    Ziggs: 150,
    DrMundo: 40,
    Kennen: 50,
    Rumble: 15,
    Malphite: 200,
    Illaoi: -85,
    Sona: -30,
    Zed: -30,
    Rengar: 70,
    Urgot: -80,
    Maokai: 110,
    Olaf: 60,
    Braum: -30,
    Lulu: 90,
    Sejuani: -30,
    Amumu: 50,
    Ornn: 80,
    Tristana: 30,
    Yorick: -60,
    Sion: -20,
    Nunu: 320,
    Rakan: -40,
    KogMaw: 250,
    Xayah: 40,
    Volibear: -70,
    Corki: 30,
    Veigar: 40,
    Ivern: 20,
    Skarner: 130,
    Teemo: 40,
    Akali: -30,
    Orianna: -50,
    Nocturne: 140,
    Irelia: -70,
    Diana: 70,
    Cassiopeia: 50,
    Twitch: 100,
    Galio: -70,
    RekSai: 260,
    Udyr: 180,
    Warwick: 240,
    Kayn: 170,
    Karthus: -60,
    Ryze: 80,
    Taric: -80,
    MasterYi: 60,
    Pyke: 70,
    Talon: 60,
    Camille: -30,
    Graves: -90,
    Janna: 30,
    Fiora: -70,
    Caitlyn: -20,
    Sivir: 60,
    Chogath: 70,
    Xerath: -80,
    Varus: -70,
    Swain: -80,
    Gangplank: 30,
};

const WIDTH = 399;
const HEIGHT = 299;
const HEADER_HEIGHT = 50;

// The splash art is stretched to this height and shifted up by SPLASH_TOP. Together they
// select the band of the splash art that shows in the header.
const SPLASH_HEIGHT = 235.45925925925926;
const SPLASH_TOP = -32.08;

// Converts SPLASH_OFFSETS, which are in pixels of the 1215 pixel wide DDragon splash, to header pixels.
const SPLASH_SCALE = WIDTH / 1215;

const BOLD_FONT = "\"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
const REGULAR_FONT = "\"Noto Sans KR\", \"Noto Sans\", sans-serif";
// Noto Sans KR reserves more room above the text than below it, so centering the line box puts
// the letters about a pixel low. Labels move up by this many pixels to make up for that.
const LABEL_SHIFT = -1;
const MUTED_COLOR = "#898991";

/**
 * Renders the leaderboard for a single champion, with the splash art of the champion as header.
 */
export async function generateChampionTopGraphic(t: Translator, options: TopGraphicOptions): Promise<Buffer> {
    const champion = options.champion!;
    const offset = (SPLASH_OFFSETS[champion.id] || 0) * SPLASH_SCALE;
    const splash = await t.staticData.getChampionSplash(champion);

    return renderGraphic(
        <Leaderboard
            t={t}
            options={options}
            header={<img src={splash} style={{ position: "absolute", left: 0, top: SPLASH_TOP - offset, width: WIDTH, height: SPLASH_HEIGHT }}/>}
            titleIcon={await t.staticData.getChampionIcon(champion)}
            showChampions={false}
        />,
        { width: WIDTH, height: HEIGHT, format: "jpeg" }
    );
}

/**
 * Renders the leaderboard over all champions. Each player shows the champion that the score belongs to.
 */
export async function generateGlobalTopGraphic(t: Translator, options: TopGraphicOptions): Promise<Buffer> {
    return renderGraphic(
        <Leaderboard
            t={t}
            options={options}
            header={<img src={asset("top-global-header.png")} style={{ width: WIDTH, height: HEADER_HEIGHT }}/>}
            showChampions={true}
        />,
        { width: WIDTH, height: HEIGHT, format: "jpeg" }
    );
}

function Leaderboard({ t, options, header, titleIcon, showChampions }: {
    t: Translator,
    options: TopGraphicOptions,
    header: ReactNode,
    titleIcon?: string,
    showChampions: boolean
}) {
    // Place, avatar, name, the optional champion icon, level icon and score.
    const columns = ["auto", "16px", "minmax(0, 1fr)", ...(showChampions ? ["16px"] : []), "16px", "auto"].join(" ");

    return (
        <div style={{ display: "flex", flexDirection: "column", width: WIDTH, height: HEIGHT, backgroundColor: "rgb(47,49,54)" }}>
            <div style={{ position: "relative", height: HEADER_HEIGHT, flexShrink: 0, overflow: "hidden" }}>
                {header}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, height: 22, margin: "8px 5px 0" }}>
                {titleIcon && <CircleImage src={titleIcon} size={22}/>}
                <Label size={13} weight={700} font={BOLD_FONT}>{options.title}</Label>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: columns,
                gridTemplateRows: `17px repeat(${options.players.length}, 24px)`,
                columnGap: 6,
                alignItems: "center",
                margin: "9px 5px 0"
            }}>
                <Label size={11} color={MUTED_COLOR} style={{ gridColumn: "1 / 4" }}>{t.command_top_graphic_name}</Label>
                <Label size={11} color={MUTED_COLOR} style={{ gridColumn: "-2 / -1", justifySelf: "end" }}>{t.command_top_graphic_score}</Label>

                {options.players.map(player => (
                    <Fragment key={player.place}>
                        <Label size={13} color="rgba(255, 255, 255, 0.6)" font={BOLD_FONT} style={{ justifySelf: "end" }}>{player.place}</Label>
                        <CircleImage src={player.avatar} size={16}/>
                        <Label size={13} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{player.username}</Label>
                        {showChampions && <CircleImage src={player.championAvatar!} size={16}/>}
                        <img src={asset(`emotes/Level_${Math.min(Math.max(player.level, 1), 10)}.png`)} style={{ width: 16, height: 16, objectFit: "contain" }}/>
                        <Label size={13} weight={700} font={BOLD_FONT} style={{ justifySelf: "end" }}>{t.number(player.score)}</Label>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

/**
 * A single line of text, moved up by LABEL_SHIFT. `style` adds to the text style, for example to place the label in a grid.
 */
function Label({ size, weight = 500, color = "#ffffff", font = REGULAR_FONT, style, children }: {
    size: number,
    weight?: number,
    color?: string,
    font?: string,
    style?: CSSProperties,
    children: ReactNode
}) {
    return (
        <span style={{ position: "relative", top: LABEL_SHIFT, fontSize: size, fontWeight: weight, color, fontFamily: font, whiteSpace: "nowrap", ...style }}>
            {children}
        </span>
    );
}

function CircleImage({ src, size }: { src: string, size: number }) {
    return <img src={src} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}/>;
}