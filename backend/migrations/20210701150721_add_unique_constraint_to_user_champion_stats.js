
exports.up = knex => knex.schema.table("user_champion_stats", table => {
    table.unique(["user_id", "champion_id"]);
});

exports.down = knex => knex.schema.table("user_champion_stats", table => {
    table.dropUnique(["user_id", "champion_id"]);
});