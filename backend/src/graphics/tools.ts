import { Canvas, createCanvas as canvasCreateCanvas, loadImage as canvasLoadImage, Image, registerFont } from "canvas";
import ExpiringMap from "../util/expiring-map";

// Expire images after 5 minutes.
const imageCache = new ExpiringMap<string, Image>(5 * 60 * 1000);
let didRegisterFonts = false;

/**
 * Wrapper around createCanvas that ensures that all fonts are registered.
 */
export function createCanvas(width: number, height: number): Canvas {
    if (!didRegisterFonts) {
        registerFont("./assets/fonts/NotoSans-Regular.ttf", { family: "Noto Sans", weight: "500" });
        registerFont("./assets/fonts/NotoSans-Bold.ttf", { family: "Noto Sans", weight: "700" });
        registerFont("./assets/fonts/NotoSansCJKkr-Regular.otf", { family: "Noto Sans KR", weight: "500" });
        registerFont("./assets/fonts/NotoSansCJKkr-Bold.otf", { family: "Noto Sans KR", weight: "700" });
        registerFont("./assets/fonts/NotoSansSmall-Bold.ttf", { family: "Noto Sans Small", weight: "700" });

        didRegisterFonts = true;
    }

    return canvasCreateCanvas(width, height);
}

/**
 * Loads the specified image, potentially consulting the cache.
 */
export async function loadImage(path: string): Promise<Image> {
    if (imageCache.has(path)) return imageCache.get(path);

    // If loading fails, use a transparent image.
    const image = await canvasLoadImage(path).catch(e => canvasLoadImage("data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="));
    imageCache.set(path, image);
    return image;
}

/**
 * Resizes the specified image and puts it on a canvas. Taken from
 * the html2canvas implementation.
 */
export function resizeImage(img: Image, size: {
    width: number,
    height: number,
    yOffset?: number
}): Canvas {
    const cv = createCanvas(size.width, size.height);
    const c = cv.getContext("2d");
    c.drawImage(img, 0, size.yOffset || 0, img.width, img.height, 0, 0, size.width, size.height);
    return cv;
}