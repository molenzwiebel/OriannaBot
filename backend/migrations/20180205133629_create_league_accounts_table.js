
exports.up = knex => knex.schema.createTable("league_accounts", table => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
    table.string("username").notNullable();
    table.string("region").notNullable();
    table.integer("summoner_id");
    table.integer("account_id");
});

exports.down = knex => knex.schema.dropTableIfExists("league_accounts");