import Redis = require("ioredis");
import config from "./config";

// Connect to redis on the specified port, prefix orianna: to all keys.
const instance = new Redis(config.redis.port, config.redis.host, {
    keyPrefix: "orianna:"
});

export default instance;