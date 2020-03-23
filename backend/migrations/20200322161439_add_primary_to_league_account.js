
exports.up = knex => knex.schema.table("league_accounts", table => {
    table.bool("primary").defaultTo(false);
});

exports.down = knex => knex.schema.table("league_accounts", table => {
    table.dropColumn("primary");
});