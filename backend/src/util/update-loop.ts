import debug = require("debug");
import elastic from "../elastic";

const log = debug("orianna:updater:update_loop");

/**
 * Creates and starts a new update loop with the specified update function, item producer, interval and amount.
 * Items will automatically be distributed over the interval, and errors and tasks that time out are automatically
 * handled.
 */
export default function scheduleUpdateLoop<T>(handler: (item: T) => Promise<any>, producer: (amount: number) => Promise<T[]>, interval: number, amount: number) {
    // Distribute the jobs over 90% of our interval to give some time for the last jobs to finish.
    const step = Math.ceil((interval * 0.90) / amount);
    let completed = amount;

    setInterval(async () => {
        // Prevent loops from overlapping and eventually clogging up.
        if (completed !== amount) return log("Warning: Update loop took more than %ims to update %i items. So far, %i items are finished.", interval, amount, completed);

        completed = 0;
        try {
            const items = await producer(amount);
            const promises = items.map((item, i) => new Promise(resolve => {
                setTimeout(() => {
                    // We catch the error but don't handle it.
                    // This is to prevent the entire Promise.all from aborting when a single reject is received.
                    handler(item).then(() => {
                        completed++;
                        resolve();
                    }).catch(() => {
                        // This still counts as completed, just erroneously :P
                        completed++;
                    });
                }, i * step);
            }));

            await Promise.all(promises);
        } catch (e) {
            // Something happened that errored.
            // We can't really do anything here, so just report it to elastic.
            elastic.reportError(e, "update loop uncaught");

            log("Error running update loop: %s", e.message);
            log("%O", e);

            // Mark as completed so we can continue normally the next cycle.
            completed = amount;
        }
    }, interval);
}