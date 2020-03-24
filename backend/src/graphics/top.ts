import { createCanvas, loadImage, resizeImage } from "./tools";
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

/**
 * The following function is generated from an instance of [html2canvas](https://github.com/niklasvh/html2canvas) on
 * a fake canvas object to retrieve the operations needed to render the specified image statically.
 */
export async function generateChampionTopGraphic(t: Translator, options: TopGraphicOptions): Promise<Buffer> {
    const splash = await t.staticData.getChampionSplash(options.champion!);
    const icon = await t.staticData.getChampionIcon(options.champion!);

    // Step 1: Load all images.
    await Promise.all([
        // Title and header images.
        loadImage(splash),
        loadImage(icon),

        // Player avatars
        ...options.players.map(x => loadImage(x.avatar)),

        // All the level icons we need.
        ...[...new Set(options.players.map(x => x.level))].map(x => loadImage(`./assets/level${x}.png`))
    ]);

    // Figure out the width our numbers need to be.
    const placeWidth = Math.max(...options.players.map(x => x.place)).toString().length * 8;

    // Step 2: Render canvas. All the code that follows was automatically generated.
    const canvas = createCanvas(399, 299);
    const ctx = canvas.getContext("2d");

    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, 399, 299);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(399, 0);
    ctx.lineTo(399, 50);
    ctx.lineTo(0, 50);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(399, 0);
    ctx.lineTo(399, 50);
    ctx.lineTo(0, 50);
    ctx.closePath();
    ctx.fillStyle = ctx.createPattern(resizeImage(await loadImage(splash), {
        "width": 399,
        "height": 235.45925925925926,
        yOffset: SPLASH_OFFSETS[options.champion!.id] || 0
    }), "repeat");
    ctx.translate(0, -503);
    ctx.fill();
    ctx.translate(0, 503);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "rgb(47,49,54)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(5, 69);
    ctx.bezierCurveTo(5, 62.92486775186127, 9.924867751861271, 58, 16, 58);
    ctx.lineTo(16, 58);
    ctx.bezierCurveTo(22.07513224813873, 58, 27, 62.92486775186127, 27, 69);
    ctx.lineTo(27, 69);
    ctx.bezierCurveTo(27, 75.07513224813873, 22.07513224813873, 80, 16, 80);
    ctx.lineTo(16, 80);
    ctx.bezierCurveTo(9.924867751861271, 80, 5, 75.07513224813873, 5, 69);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(await loadImage(icon), 0, 0, 120, 120, 5, 58, 22, 22);
    ctx.restore();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "bold 13px \"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(options.title, 32, 78);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "11px \"Noto Sans KR\", \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText(t.command_top_graphic_name, 5, 102.5);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "11px \"Noto Sans KR\", \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText(t.command_top_graphic_score, 294, 102.5);
    ctx.restore();

    for (let i = 0; i < options.players.length; i++) {
        const player = options.players[i];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.font = "13px \"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText(player.place.toString(), 5, 127 + 24 * i);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.beginPath();
        ctx.arc(19 + placeWidth, 118 + 24 * i, 8, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(await loadImage(player.avatar), 0, 0, 16, 16, 11 + placeWidth, 110 + 24 * i, 16, 16);
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(41, 106 + 24 * i);
        ctx.lineTo(261, 106 + 24 * i);
        ctx.lineTo(261, 130 + 24 * i);
        ctx.lineTo(41, 130 + 24 * i);
        ctx.closePath();
        ctx.clip();
        ctx.font = "13px \"Noto Sans KR\", \"Noto Sans\", sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(player.username, 33 + placeWidth, 127 + 24 * i);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(294, 110 + 24 * i);
        ctx.lineTo(310, 110 + 24 * i);
        ctx.lineTo(310, 126 + 24 * i);
        ctx.lineTo(294, 126 + 24 * i);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(await loadImage(`./assets/level${player.level}.png`), 0, 0, 105, 103, 294, 110 + 24 * i, 16, 16);
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50 + 24 * i);
        ctx.lineTo(399, 50 + 24 * i);
        ctx.lineTo(399, 300 + 24 * i);
        ctx.lineTo(0, 300 + 24 * i);
        ctx.closePath();
        ctx.clip();
        ctx.font = "bold 13px \"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(t.number(player.score), 314, 127 + 24 * i);
        ctx.restore();
    }

    return canvas.toBuffer("image/jpeg", { quality: 1 });
}

/**
 * The following function is generated from an instance of [html2canvas](https://github.com/niklasvh/html2canvas) on
 * a fake canvas object to retrieve the operations needed to render the specified image statically.
 */
export async function generateGlobalTopGraphic(t: Translator, options: TopGraphicOptions): Promise<Buffer> {
    // Step 1: Load all images.
    await Promise.all([
        // Title and header images.
        loadImage("https://i.imgur.com/XVKpmRV.png"),

        // Player avatars
        ...options.players.map(x => loadImage(x.avatar)),

        // Champion images
        ...options.players.map(x => loadImage(x.championAvatar!)),

        // All the level icons we need.
        ...[...new Set(options.players.map(x => x.level))].map(x => loadImage(`./assets/level${x}.png`))
    ]);

    // Figure out the width our numbers need to be.
    const placeWidth = Math.max(...options.players.map(x => x.place)).toString().length * 8;

    // Step 2: Render canvas. All the code that follows was automatically generated.
    const canvas = createCanvas(399, 299);
    const ctx = canvas.getContext("2d");

    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, 399, 299);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(399, 0);
    ctx.lineTo(399, 50);
    ctx.lineTo(0, 50);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(399, 0);
    ctx.lineTo(399, 50);
    ctx.lineTo(0, 50);
    ctx.closePath();
    ctx.fillStyle = ctx.createPattern(resizeImage(await loadImage("https://i.imgur.com/XVKpmRV.png"), {
        "width": 399,
        "height": 235.45925925925926
    }), "repeat");
    ctx.translate(0, -503);
    ctx.fill();
    ctx.translate(0, 503);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "rgb(47,49,54)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "bold 13px \"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(options.title, 5, 78);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "11px \"Noto Sans KR\", \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText(t.command_top_graphic_name, 5, 102.5);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "11px \"Noto Sans KR\", \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText(t.command_top_graphic_score, 273, 102.5);
    ctx.restore();

    for (let i = 0; i < options.players.length; i++) {
        const player = options.players[i];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.font = "13px \"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText(player.place.toString(), 5, 127 + 24 * i);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.beginPath();
        ctx.arc(19 + placeWidth, 118 + 24 * i, 8, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(await loadImage(player.avatar), 0, 0, 16, 16, 11 + placeWidth, 110 + 24 * i, 16, 16);
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(41, 106 + 24 * i);
        ctx.lineTo(261, 106 + 24 * i);
        ctx.lineTo(261, 130 + 24 * i);
        ctx.lineTo(41, 130 + 24 * i);
        ctx.closePath();
        ctx.clip();
        ctx.font = "13px \"Noto Sans KR\", \"Noto Sans\", sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(player.username, 33 + placeWidth, 127 + 24 * i);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(399, 50);
        ctx.lineTo(399, 300);
        ctx.lineTo(0, 300);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.beginPath();
        ctx.arc(281, 118 + 24 * i, 8, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(await loadImage(player.championAvatar!), 0, 0, 120, 120, 273, 110 + 24 * i, 16, 16);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(294, 110 + 24 * i);
        ctx.lineTo(310, 110 + 24 * i);
        ctx.lineTo(310, 126 + 24 * i);
        ctx.lineTo(294, 126 + 24 * i);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(await loadImage(`./assets/level${player.level}.png`), 0, 0, 105, 103, 294, 110 + 24 * i, 16, 16);
        ctx.restore();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 50 + 24 * i);
        ctx.lineTo(399, 50 + 24 * i);
        ctx.lineTo(399, 300 + 24 * i);
        ctx.lineTo(0, 300 + 24 * i);
        ctx.closePath();
        ctx.clip();
        ctx.font = "bold 13px \"Noto Sans KR\", \"Noto Sans Small\", sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(t.number(player.score), 314, 127 + 24 * i);
        ctx.restore();
    }

    return canvas.toBuffer("image/jpeg", { quality: 1 });
}