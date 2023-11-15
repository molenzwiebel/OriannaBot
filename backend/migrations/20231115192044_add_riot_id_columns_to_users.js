
exports.up = knex => knex.schema.table("league_accounts", table => {
    table.string("riot_id_game_name").nullable().default(null);
    table.string("riot_id_tagline").nullable().default(null);
});

exports.down = knex => knex.schema.table("league_accounts", table => {
    table.dropColumn("riot_id_game_name");
    table.dropColumn("riot_id_tagline");
});
