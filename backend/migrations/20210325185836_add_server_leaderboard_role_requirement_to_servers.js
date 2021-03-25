
exports.up = knex => knex.schema.table("servers", table => {
    table.string("server_leaderboard_role_requirement").nullable().defaultTo(null);
});

exports.down = knex => knex.schema.table("servers", table => {
    table.dropColumn("server_leaderboard_role_requirement");
});