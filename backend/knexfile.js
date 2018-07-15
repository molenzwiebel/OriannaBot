const config = require("./config.json");
const db = {
    client: "postgres",
    connection: config.db
};

module.exports = {
    development: db,
    production: db
};