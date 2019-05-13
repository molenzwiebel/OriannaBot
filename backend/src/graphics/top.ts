import { createCanvas, loadImage, resizeImage } from "./tools";

export interface TopGraphicOptions {
    headerImage: string;

    title: string;
    titleImage?: string;

    players: {
        championAvatar?: string;
        place: number;
        username: string;
        avatar: string;
        score: number;
        level: number;
    }[];
}

/**
 * The following function is generated from an instance of [html2canvas](https://github.com/niklasvh/html2canvas) on
 * a fake canvas object to retrieve the operations needed to render the specified image statically.
 */
export async function generateChampionTopGraphic(options: TopGraphicOptions): Promise<Buffer> {
    // Step 1: Load all images.
    await Promise.all([
        // Title and header images.
        loadImage(options.headerImage),
        loadImage(options.titleImage!),

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
    ctx.fillStyle = ctx.createPattern(resizeImage(await loadImage(options.headerImage), {
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
    ctx.fillStyle = "rgb(52,54,60)";
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
    ctx.drawImage(await loadImage(options.titleImage!), 0, 0, 120, 120, 5, 58, 22, 22);
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
    ctx.font = "bold 13px \"Noto Sans Small\", sans-serif";
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
    ctx.font = "11px \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText("NAME", 5, 102.5);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "11px \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText("SCORE", 294, 102.5);
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
        ctx.font = "13px \"Noto Sans Small\", sans-serif";
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
        ctx.font = "13px \"Noto Sans\", sans-serif";
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
        ctx.font = "bold 13px \"Noto Sans Small\", sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(player.score.toLocaleString(), 314, 127 + 24 * i);
        ctx.restore();
    }

    return canvas.toBuffer("image/jpeg", { quality: 1 });
}

/**
 * The following function is generated from an instance of [html2canvas](https://github.com/niklasvh/html2canvas) on
 * a fake canvas object to retrieve the operations needed to render the specified image statically.
 */
export async function generateGlobalTopGraphic(options: TopGraphicOptions): Promise<Buffer> {
    // Step 1: Load all images.
    await Promise.all([
        // Title and header images.
        loadImage(options.headerImage),

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
    ctx.fillStyle = ctx.createPattern(resizeImage(await loadImage(options.headerImage), {
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
    ctx.fillStyle = "rgb(52,54,60)";
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
    ctx.font = "bold 13px \"Noto Sans Small\", sans-serif";
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
    ctx.font = "11px \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText("NAME", 5, 102.5);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(399, 50);
    ctx.lineTo(399, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.clip();
    ctx.font = "11px \"Noto Sans\", sans-serif";
    ctx.fillStyle = "#898991";
    ctx.fillText("SCORE", 273, 102.5);
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
        ctx.font = "13px \"Noto Sans Small\", sans-serif";
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
        ctx.font = "13px \"Noto Sans\", sans-serif";
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
        ctx.font = "bold 13px \"Noto Sans Small\", sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(player.score.toLocaleString(), 314, 127 + 24 * i);
        ctx.restore();
    }

    return canvas.toBuffer("image/jpeg", { quality: 1 });
}