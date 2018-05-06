import { Model } from "objection";
import Knex = require("knex");

const knex = Knex({
    client: "sqlite3",
    connection: {
        filename: "./dev.sqlite3"
    },
    useNullAsDefault: true
});
knex.migrate.latest();

Model.knex(knex);

export { default as LeagueAccount } from "./league_account";
export { default as Role, RoleCondition } from "./role";
export { default as User, UserChampionStat, UserRank, UserAuthKey } from "./user";
export { default as Server, BlacklistedChannel } from "./server";