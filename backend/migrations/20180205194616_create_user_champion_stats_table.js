
exports.up = knex => knex.schema.createTable("user_champion_stats", table => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
    table.integer("champion_id").notNullable();
    table.integer("level").notNullable();
    table.integer("score").notNullable();
    table.integer("games_played").notNullable();
});

exports.down = knex => knex.schema.dropTableIfExists("user_champion_stats");