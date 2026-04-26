import Redis = require("ioredis");
import config from "./config";

// Connect to redis on the specified port, prefix dissonance: to all keys.
export const dissonanceRedis = new Redis(config.redis.url, {
    keyPrefix: "dissonance:"
});

/**
 * Returns the cached guild information for the specified ID, or null
 * if that guild is not currently cached.
 */
export async function getCachedGuild(id: string): Promise<dissonance.Guild | null> {
    const data = await dissonanceRedis.get(`guild:${id}`);
    return data ? JSON.parse(data) : null;
}
