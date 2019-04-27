
exports.up = knex => knex.schema.table("user_champion_stats", table => {
    table.dropColumn("games_played");
});

exports.down = knex => knex.schema.table("user_champion_stats", table => {
    table.integer("games_played").notNullable();
});