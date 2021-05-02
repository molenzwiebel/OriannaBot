import Redis = require("ioredis");
import config from "./config";

// Connect to redis on the specified port, prefix orianna: to all keys.
const instance = new Redis(config.redis.port, config.redis.host, {
    keyPrefix: "orianna:"
});

// Connect to redis on the specified port, prefix orianna: to all keys.
const dissonanceInstance = new Redis(config.redis.port, config.redis.host, {
    keyPrefix: "dissonance:"
});

/**
 * Returns the cached guild information for the specified ID, or null
 * if that guild is not currently cached.
 */
export async function getCachedGuild(id: string): Promise<dissonance.Guild | null> {
    const data = await dissonanceInstance.get(`guild:${id}`);
    return data ? JSON.parse(data) : null;
}

export default instance;