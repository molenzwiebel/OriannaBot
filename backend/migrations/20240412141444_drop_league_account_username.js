
exports.up = knex => knex.schema.table("league_accounts", table => {
    table.dropColumn("username");
});

exports.down = knex => knex.schema.table("league_accounts", table => {
    table.string("username").nullable().default(null);
});