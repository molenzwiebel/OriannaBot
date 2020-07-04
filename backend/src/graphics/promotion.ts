import * as fs from "fs";
import __fontkit, { Font } from "fontkit";
import fetch from "node-fetch";
import * as punycode from "punycode";
import { sync as rmdirSync } from "rimraf";
import * as path from "path";
import * as child_process from "child_process";
import config from "../config";
import * as randomstring from "randomstring";

const fontkit: typeof __fontkit = require("fontkit"); // fontkit type defs are wrong

interface PromotionGraphicArgs {
    name: string;
    title: string;
    icon: string;
    champion?: string;
    background?: string;
}

const ASSETS_DIR = path.resolve(__dirname, "../../assets/promotion");
const TEMP_DIR = path.resolve(__dirname, "../../temp");

const DEFAULT_CHAMPION_ICON = path.join(ASSETS_DIR, "./champion_icon.png");
const DEFAULT_BACKGROUND = path.join(ASSETS_DIR, "./background.jpg");

const NAME_FONTS = [
    path.join(ASSETS_DIR, "../fonts/BeaufortforLOL-Bold.ttf"),
    path.join(ASSETS_DIR, "../fonts/NotoSansCJKkr-Bold.otf"),
    path.join(ASSETS_DIR, "../fonts/NotoColorEmoji.ttf"),
    path.join(ASSETS_DIR, "../fonts/NotoEmoji-Regular.ttf"),
    path.join(ASSETS_DIR, "../fonts/NotoSans-Bold.ttf")
];

const TITLE_FONTS = [
    path.join(ASSETS_DIR, "../fonts/BeaufortforLOL-Regular.ttf"),
    path.join(ASSETS_DIR, "../fonts/NotoSansCJKkr-Regular.otf"),
    path.join(ASSETS_DIR, "../fonts/NotoColorEmoji.ttf"),
    path.join(ASSETS_DIR, "../fonts/NotoEmoji-Regular.ttf"),
    path.join(ASSETS_DIR, "../fonts/NotoSans-Regular.ttf")
];

const FONT_CACHE = new Map<string, Font>();

/**
 * Gets the instantiated font instance for the specified path, either
 * using the font cache or synchronously instantiating it.
 */
function getFont(path: string): Font {
    if (FONT_CACHE.has(path)) return FONT_CACHE.get(path)!;

    const font = fontkit.openSync(path);
    FONT_CACHE.set(path, font);

    return font;
}

/**
 * Given the specified font options and the specified text, selects
 * the font that can render the most glyphs in the string. If there
 * is a tie, selects the first element in the list that matches.
 */
function selectFont(options: string[], text: string): string {
    const codePoints = punycode.ucs2.decode(text);

    return options
        .map<[string, Font]>(o => [o, getFont(o)])
        .map<[string, number]>(([path, font]) => [path, codePoints.filter(x => font.hasGlyphForCodePoint(x)).length])
        .sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Runs ffmpeg with the specified args and returns a promise that
 * resolves when the command finishes executing.
 */
async function runFfmpeg(args: string[], timeout = 20000): Promise<void> {
    const cmd = child_process.spawn(config.ffmpeg, args);

    // Wait for ffmpeg to exit, or else for the timeout to expire.
    const result = await Promise.race([
        new Promise<false>(r => setTimeout(() => r(false), timeout)),
        new Promise<true>(r => cmd.once("exit", () => r(true)))
    ]);

    if (!result) {
        cmd.kill("SIGKILL");
        throw new Error("ffmpeg timed out after " + timeout + "ms");
    }
}

/**
 * Escapes the specified path so that it can be used in ffmpeg.
 */
function escapePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/:/g, "\\:");
}

/**
 * Downloads the specified file to the specified file path.
 */
async function downloadFile(url: string, path: string): Promise<void> {
    const res = await fetch(url);

    await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(path);

        res.body.pipe(fileStream);

        res.body.on("error", (err) => {
            reject(err);
        });

        fileStream.on("finish", function() {
            resolve();
        });
    });
}

/**
 * Generates the promotion gif shown when a user gains a role.
 */
export default async function generatePromotionGraphic(args: PromotionGraphicArgs): Promise<Buffer> {
    args.name = args.name.toUpperCase();
    args.title = args.title.toUpperCase();

    const tempDir = path.join(TEMP_DIR, randomstring.generate());
    fs.mkdirSync(tempDir);

    const nameTextFile = path.join(tempDir, "./name.txt");
    const titleTextFile = path.join(tempDir, "./title.txt");

    const championIconPath = path.join(tempDir, "./champion.png");
    const backgroundPath = path.join(tempDir, "./background.png");
    const avatarPath = path.join(tempDir, "./avatar.png");

    const nameFont = escapePath(selectFont(NAME_FONTS, args.name));
    const titleFont = escapePath(selectFont(TITLE_FONTS, args.title));

    fs.writeFileSync(nameTextFile, args.name);
    fs.writeFileSync(titleTextFile, args.title);

    // Download or copy champion/background images where appropriate.
    if (args.champion && args.background) {
        // If both exist, download in parallel.
        await Promise.all([
            downloadFile(args.champion, championIconPath),
            downloadFile(args.background, backgroundPath)
        ]);
    } else {
        if (!args.champion) {
            fs.copyFileSync(DEFAULT_CHAMPION_ICON, championIconPath);
        } else {
            await downloadFile(args.champion, championIconPath);
        }

        if (!args.background) {
            fs.copyFileSync(DEFAULT_BACKGROUND, backgroundPath);
        } else {
            await downloadFile(args.background, backgroundPath);
        }
    }

    await downloadFile(args.icon, avatarPath);

    const ffmpegArgs = [
        "-y", // allow overwriting
        "-i", path.join(ASSETS_DIR, "intro-background.jpg"),
        "-c:v", "libvpx", "-i", path.join(ASSETS_DIR, "eog_intro_magic.webm"),
        "-c:v", "libvpx", "-itsoffset", "00:00:01.900", "-i", path.join(ASSETS_DIR, "levelupexplosion_small.webm"),
        "-loop", "1", "-itsoffset", "00:00:00.450", "-i", path.join(ASSETS_DIR, "level_container.png"),
        "-loop", "1", "-itsoffset", "00:00:00.450", "-i", championIconPath,
        "-itsoffset", "00:00:00.450", "-i", avatarPath,
        "-itsoffset", "00:00:00.250", "-i", path.join(ASSETS_DIR, "xp_circle.mp4"),
        "-loop", "1", "-i", path.join(ASSETS_DIR, "xp_circle_mask.png"),
        "-loop", "1", "-i", path.join(ASSETS_DIR, "background_mask.png"),
        "-loop", "1", "-i", backgroundPath,
        "-loop", "1", "-i", path.join(ASSETS_DIR, "divider.png"),
        "-filter_complex",
        `
            [0:v] setpts=PTS-STARTPTS [background];
            [1:v] setpts=PTS-STARTPTS, scale=800:300, premultiply=inplace=1 [intro];
            [2:v] scale=998:257, premultiply=inplace=1 [explode];
            [3:v] format=rgba [border];
            [4:v] scale=26:26 [champion_icon_scaled];
            [5:v] trim=end_frame=1, scale=130:130, geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':130:130 [avatar_mask];
            [5:v] scale=130:130 [avatar];
            [6:v][7:v] alphamerge, select='gte(n\\, 5)' [xp_circle];
            [avatar][avatar_mask] alphamerge [avatar_circle];
            color=c=black@0:s=800x300 [icon_bg];
            color=c=black:s=800x300 [name_black_bg];
            color=c=black@0:s=800x300 [name_background_bg];
            [9:v] scale=800:-1 [scaled_name_bg];
            [name_background_bg][scaled_name_bg] overlay=x=200:y=0 [moved_name_bg];
            [moved_name_bg][8:v] alphamerge [alphad_name_bg];
            [name_black_bg][alphad_name_bg] overlay=x=0:y=0 [name_bg_on_black];
            [name_bg_on_black] drawtext=fontfile='${nameFont}':textfile='${escapePath(nameTextFile)}':y=57:x=(400-text_w)/2:fontcolor=0xf0e6d2:fontsize=35 [name_bg_on_black+title];
            [name_bg_on_black+title] drawtext=fontfile='${titleFont}':textfile='${escapePath(titleTextFile)}':y=143:x=(400-text_w)/2:fontcolor=0xfffaef:fontsize=30 [name_bg_on_black+text];
            [name_bg_on_black+text][10:v] overlay=x=74:y=88 [final_name];
            [final_name] fade=d=0.2:t=in:alpha=1, setpts=PTS+2.25/TB, tpad=stop_mode=clone:stop_duration=1 [name_fadein];
            [icon_bg][avatar_circle] overlay=x=335:y=45 [full_bg_avatar];
            [full_bg_avatar][xp_circle] overlay=x=0:y=0 [full_bg_avatar+xp];
            [full_bg_avatar+xp][champion_icon_scaled] overlay=x=388:y=156 [champion_icon];
            [champion_icon][border] overlay=x=300:y=10 [champion_icon+border+xp];
            [background][intro] overlay=y=-25 [background+intro];
            [champion_icon+border+xp] fade=d=0.5:t=in:alpha=1 [icon_fadein];
            [background+intro][icon_fadein] overlay=x=0:y=0 [intro+icon];
            [intro+icon][explode] overlay=x=-102:y=-18:shortest=1 [explosion_intro];
            [explosion_intro][name_fadein] overlay=x=0:y=0:shortest=1
        `,
        "-b:v", "0", "-crf", "0", path.join(tempDir, "out.mp4")
    ];

    // Create main video.
    await runFfmpeg(ffmpegArgs);

    // Extract last frame.
    await runFfmpeg([
        "-sseof", "-1", "-i", path.join(tempDir, "out.mp4"),
        "-update", "1", "-q:v", "1", "-y", path.join(tempDir, "last-frame.png")
    ]);

    // Generate palette.
    await runFfmpeg([
        "-i", path.join(tempDir, "out.mp4"),
        "-vf", "fps=10,palettegen=stats_mode=full",
        "-y", path.join(tempDir, "palette.png")
    ]);

    // Generate gif, prepending the last frame.
    await runFfmpeg([
        "-i", path.join(tempDir, "out.mp4"),
        "-i", path.join(tempDir, "palette.png"),
        "-i", path.join(tempDir, "last-frame.png"),
        "-lavfi", `[2:v] tpad=stop_mode=clone:stop=5 [last]; [last][0:v] concat,fps=10 [x]; [x][1:v] paletteuse=dither=sierra2_4a`,
        "-loop", "-1", "-y", path.join(tempDir, "out.gif")
    ]);

    // Return result.
    const result = await new Promise<Buffer>(resolve => {
        fs.readFile(path.join(tempDir, "out.gif"), (err, data) => {
            resolve(data)
        });
    });

    // Delete temp folder.
    rmdirSync(tempDir);

    return result;
}
