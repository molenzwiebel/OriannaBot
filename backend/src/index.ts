import { Model } from "objection";
import Knex = require("knex");

(async() => {
    Model.knex(Knex({
        debug: true,
        client: "sqlite3",
        connection: {
            filename: "./dev.sqlite3"
        },
        useNullAsDefault: true
    }));
})();