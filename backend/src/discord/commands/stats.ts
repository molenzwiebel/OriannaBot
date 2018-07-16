import { Command } from "../command";

const StatsCommand: Command = {
    name: "Show Stats",
    smallDescription: "",
    description: ``.trim(),
    hideFromHelp: true,
    keywords: ["stats", "graph", "chart", "progression", "progress"],
    async handler({ info }) {
        info({
            description: "Soon:tm: (or not, haven't yet decided if I want stats back in ori v2)."
        });
    }
};
export default StatsCommand;