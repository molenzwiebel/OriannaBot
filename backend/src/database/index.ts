import { Model } from "objection";
import Knex = require("knex");

Model.knex(Knex({
    debug: true,
    client: "sqlite3",
    connection: {
        filename: "./dev.sqlite3"
    },
    useNullAsDefault: true
}));

export { default as LeagueAccount } from "./league_account";
export { default as Role, RoleCondition } from "./role";
export { default as User, UserChampionStat } from "./user";
export { default as Server, BlacklistedChannel } from "./server";