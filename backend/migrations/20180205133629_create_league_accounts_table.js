
exports.up = knex => knex.schema.createTable("league_accounts", table => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
    table.string("username").notNullable();
    table.string("region").notNullable();
    table.bigInteger("summoner_id");
    table.bigInteger("account_id");
    table.index(["user_id"]);
});

exports.down = knex => knex.schema.dropTableIfExists("league_accounts");