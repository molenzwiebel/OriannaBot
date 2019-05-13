import * as express from "express";
import * as fs from "fs";
import randomstring = require("randomstring");
import config from "../config";
import ExpiringMap from "../util/expiring-map";
import * as path from "path";

// Folder name for image storage.
const IMAGES = path.join(__dirname, "../../generated-images");

// List of images that are still being generated. Those should buffer endlessly in
// express until they are actually done.
const generatingImages = new Map<string, Promise<void>>();

// List of images that were recently generated. If a request for a similar cache key
// comes in within a short time period, use the cache instead.
const imageCache = new ExpiringMap<string, string>(5 * 60 * 1000); // 5 minutes

/**
 * Creates a random file for the specified image to be generated, then returns the path to
 * that image. If the image was generated recently, return the cached version instead. Requests
 * to the specified image will be buffered by express until the image finishes rendering. This
 * way we can get our response out to Discord earlier while generating the image in the background.
 */
export function createGeneratedImagePath(cacheKey: string, generate: () => Promise<Buffer>): string {
    if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

    const key = randomstring.generate({ length: 32 });

    const promise = generate().then(result => {
        return new Promise(resolve => fs.writeFile(path.join(IMAGES, key + ".jpg"), result, () => resolve()));
    }).then(() => {
        generatingImages.delete(key);
    });

    const url = config.web.url + "/img/generated/" + key + ".jpg";

    generatingImages.set(key, promise);
    imageCache.set(cacheKey, url);

    return url;
}

/**
 * Registers a middleware for express that will handle both existing and currently generating
 * images and buffer until they are done loading. Forwards the rest to the next entry in the middleware.
 */
export default function register(app: express.Application) {
    app.get("/img/generated/:key.jpg", async (req, res, next) => {
        // If this is still generating, wait for it to finish.
        if (generatingImages.has(req.params.key)) {
            await generatingImages.get(req.params.key);
        }

        // Check if the file exists, return next if it doesn't.
        const filePath = path.join(IMAGES, req.params.key + ".jpg");
        const exists = fs.existsSync(filePath);
        if (!exists) return next();

        res.contentType("image/jpeg");
        fs.createReadStream(filePath).pipe(res);
    });
}