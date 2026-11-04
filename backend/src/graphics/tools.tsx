import * as fs from "fs";
import * as path from "path";
import { render } from "takumi-js";
import { Renderer } from "takumi-js/node";
import { ReactElement } from "react";

const ASSETS_DIR = path.resolve(__dirname, "../../assets");
const FONTS_DIR = path.join(ASSETS_DIR, "fonts");

/**
 * Fonts registered on the shared renderer, as `[family, weight, file]`. Use 500 for regular
 * text and 700 for bold text.
 */
const FONTS: [string, number, string][] = [
    ["Noto Sans", 500, "NotoSans-Regular.ttf"],
    ["Noto Sans", 700, "NotoSans-Bold.ttf"],
    ["Noto Sans KR", 500, "NotoSansCJKkr-Regular.otf"],
    ["Noto Sans KR", 700, "NotoSansCJKkr-Bold.otf"],
    ["Noto Sans Small", 700, "NotoSansSmall-Bold.ttf"]
];

const assetUris = new Map<string, string>();

let rendererPromise: Promise<Renderer> | null = null;

async function getRenderer() {
    if (!rendererPromise) {
        rendererPromise = (async () => {
            const renderer = new Renderer();
            for (const [name, weight, file] of FONTS) {
                await renderer.registerFont({ name, weight, data: await fs.promises.readFile(path.join(FONTS_DIR, file)) });
            }
            return renderer;
        })();
    }

    return rendererPromise;
}

/**
 * Renders the element to an image of the specified size. A remote image that fails
 * to load, such as an avatar or an emoji, is left out of the image.
 */
export async function renderGraphic(element: ReactElement, options: { width: number, height: number, format: "png" | "jpeg" }): Promise<Buffer> {
    const result = await render(element, {
        renderer: await getRenderer(),
        width: options.width,
        height: options.height,
        format: options.format,
        quality: options.format === "jpeg" ? 100 : undefined,
        images: { throwOnError: false }
    });

    return Buffer.from(result);
}

/**
 * Renders an SVG document to a PNG of the specified size, with a transparent background.
 */
export function renderSvg(svg: string, width: number, height: number): Promise<Buffer> {
    return renderGraphic(<img src={svg} width={width} height={height}/>, { width, height, format: "png" });
}

/**
 * Returns an image `src` for the PNG file at the specified path inside `assets`.
 */
export function asset(file: string): string {
    let uri = assetUris.get(file);
    if (!uri) {
        // takumi caches the decoded pixels of a data URI, which it doesn't do for raw bytes.
        uri = "data:image/png;base64," + fs.readFileSync(path.join(ASSETS_DIR, file)).toString("base64");
        assetUris.set(file, uri);
    }

    return uri;
}
