
exports.up = knex => knex.schema.table("users", table => {
    table.bool("treat_as_unranked").defaultTo(false);
    table.bool("hide_accounts").defaultTo(false);
});

exports.down = knex => knex.schema.table("users", table => {
    table.dropColumn("treat_as_unranked");
    table.dropColumn("hide_accounts");
});