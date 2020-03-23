
exports.up = knex => knex.schema.table("league_accounts", table => {
    table.bool("show_in_profile").defaultTo(true);
    table.bool("include_region").defaultTo(true);
});

exports.down = knex => knex.schema.table("league_accounts", table => {
    table.dropColumn("show_in_profile");
    table.dropColumn("include_region");
});