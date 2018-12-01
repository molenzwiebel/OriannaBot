
exports.up = knex => knex.schema.table("league_accounts", table => {
    table.string("account_id").alter();
    table.string("summoner_id").alter();
    table.string("puuid").notNullable().default("");
});

exports.down = knex => knex.schema.table("league_accounts", table => {
    table.bigInteger("account_id").alter();
    table.bigInteger("summoner_id").alter();
    table.dropColumn("puuid");
});