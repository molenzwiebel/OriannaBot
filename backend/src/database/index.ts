import { Model } from "objection";
import Knex = require("knex");
import config from "../config";

const knex = Knex({
    client: "postgres",
    connection: config.db
});
// knex.migrate.rollback();
knex.migrate.latest();

Model.knex(knex);

export { default as LeagueAccount } from "./league_account";
export { default as Role, RoleCondition } from "./role";
export { default as User, UserChampionStat, UserRank, UserAuthKey, UserMasteryDelta } from "./user";
export { default as Server, BlacklistedChannel } from "./server";