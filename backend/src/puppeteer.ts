import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as child_process from "child_process";
import config from "./config";
import { Writable } from "stream";
import { EventEmitter } from "events";

export interface ScreenshotRenderArgs {
    screenshot: {
        width: number;
        height: number;
    };
    args: object;
}

export interface GifRenderArgs {
    gif: {
        width: number;
        height: number;
        length: number;
        fpsScale: number;
    };
    args: object;
}

export type RenderArgs = ScreenshotRenderArgs | GifRenderArgs;

export default class PuppeteerController extends EventEmitter {
    private browser: puppeteer.Browser;
    private page: puppeteer.Page;

    private working = false;
    private queue: { file: string, options: RenderArgs, resolve: Function, reject: Function }[] = [];

    public async initialize() {
        await this.createBrowser();

        // Restart chrome every 5 minutes to prevent memory leaks.
        setInterval(async () => {
            // Don't restart if we're currently processing jobs.
            if (this.queue.length || this.working) return;

            await this.browser.close();
            await this.createBrowser();
        }, 5 * 60 * 1000);
    }

    /**
     * Renders a screenshot or gif from the specified html file and options.
     */
    public async render(file: string, options: RenderArgs): Promise<Buffer> {
        return new Promise<Buffer>(async (resolve, reject) => {
            this.queue.push({ file, options, resolve, reject });
            if (this.working) return;

            this.working = true;
            while (this.queue.length) {
                const { file, options, resolve, reject } = this.queue.shift()!;
                try {
                    await this.doRender(file, options, resolve);
                } catch (e) {
                    reject(e);
                }
            }
            this.working = false;
        });
    }

    /**
     * Constructs the chrome instance and creates a new page available for use.
     */
    private async createBrowser() {
        // Include no-sandbox so we can run as root in CI environments and docker containers.
        this.browser = await puppeteer.launch({ args: ["--no-sandbox"] });

        this.page = await this.browser.newPage();
        await this.page.exposeFunction("ready", () => {
            this.emit("ready");
        });
    }

    /**
     * Actually does the rendering for the specified job. Either delegates to
     * the screenshot or gif handler, depending on the options.
     */
    private async doRender(file: string, options: RenderArgs, resolve: Function) {
        await this.preparePage(file, options);

        if ((<any>options).gif) {
            await this.renderGif(<GifRenderArgs>options, resolve);
        } else {
            await this.renderScreenshot(<ScreenshotRenderArgs>options, resolve);
        }
    }

    /**
     * Loads the specified file and calls the `prepare` method. After that, waits for
     * the code to call `ready`, before resolving the promise.
     */
    private async preparePage(file: string, options: RenderArgs) {
        await this.page.goto("about:blank");
        await this.page.setContent(fs.readFileSync(file, "utf8"));

        await this.page.waitForSelector(".ready");

        const promise = new Promise(r => this.once("ready", () => r()));
        await this.page.evaluate(<any>{ toString: () => `(arg) => window.prepare(arg)` }, options.args);

        return promise;
    }

    /**
     * Renders a screenshot of the current page with the specified options.
     */
    private async renderScreenshot(options: ScreenshotRenderArgs, resolve: Function) {
        resolve(await this.page.screenshot({
            omitBackground: true,
            clip: {
                x: 0,
                y: 0,
                width: options.screenshot.width,
                height: options.screenshot.height
            }
        }));
    }

    /**
     * Renders a gif of the current page with the specified options.
     */
    private async renderGif(options: GifRenderArgs, resolve: Function) {
        if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");

        // Scale page to only record our viewport.
        await this.page.setViewport({ width: options.gif.width, height: options.gif.height });

        // Enable tracing with screenshots on every frame, wait for the specified length, then stop tracing.
        await this.page.tracing.start({ path: "./temp/trace.json", screenshots: true, categories: ["__metadata"] });
        await new Promise(r => setTimeout(r, options.gif.length * 1000));
        await this.page.tracing.stop();

        // Stream the screenshots into ffmpeg to turn them into a video.
        const screenshots: { args: { snapshot: string } }[] = JSON.parse(fs.readFileSync("./temp/trace.json", "utf8")).traceEvents.filter((x: any) => x.name === "Screenshot");
        const fps = screenshots.length / options.gif.length / options.gif.fpsScale;
        const ffmpeg = child_process.spawn(config.ffmpeg, ["-y", "-f", "image2pipe", "-r", fps.toString(), "-i", "-", "./temp/gif-out.mp4"]);

        // Have the last frame also as the first frame as a "placeholder" for non-autoplay/mobile.
        for (let i = 0; i < 2; i++) await write(ffmpeg.stdin, Buffer.from(screenshots[screenshots.length - 1].args.snapshot, "base64"));

        // Write the rest of the screenshots.
        for (const screenshot of screenshots) {
            await write(ffmpeg.stdin, Buffer.from(screenshot.args.snapshot, "base64"));
        }

        // Wait for ffmpeg to finish.
        ffmpeg.stdin.end();
        await new Promise(r => ffmpeg.on("exit", r));

        // Now run ffmpeg again to generate a gif palette for the video.
        await new Promise(resolve => {
            child_process.exec([config.ffmpeg, "-i", "./temp/gif-out.mp4", "-vf", "fps=10,palettegen=stats_mode=full", "-y", "./temp/gif-palette.png"].join(" "), () => resolve());
        });

        // Now run ffmpeg yet again to actually generate the gif.
        await new Promise(resolve => {
            child_process.exec([config.ffmpeg, "-i", "./temp/gif-out.mp4", "-i", "./temp/gif-palette.png", "-lavfi", `"fps=10 [x]; [x][1:v] paletteuse=dither=sierra2_4a"`, "-loop", "-1", "-y", "./temp/gif-out.gif"].join(" "), () => resolve());
        });

        // Finally, return the gif.
        fs.readFile("./temp/gif-out.gif", (err, buf) => {
            resolve(buf);
        });
    }
}

// Simple helper function to turn Writable.write into a promise.
const write = (stream: Writable, buffer: Buffer) => new Promise((resolve, reject) => {
    stream.write(buffer, (error: Error | null) => {
        if (error) reject(error);
        else resolve();
    });
});