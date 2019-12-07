
exports.up = knex => knex.schema.table("league_accounts", table => {
    table.string("tft_account_id").notNullable().default("");
    table.string("tft_summoner_id").notNullable().default("");
    table.string("tft_puuid").notNullable().default("");
});

exports.down = knex => knex.schema.table("league_accounts", table => {
    table.dropColumn("tft_account_id");
    table.dropColumn("tft_summoner_id");
    table.dropColumn("tft_puuid");
});