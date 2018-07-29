
exports.up = knex => knex.schema.table("servers", table => {
    table.bool("completed_intro").defaultTo(true);
});

exports.down = knex => knex.schema.table("servers", table => {
    table.dropColumn("completed_intro");
});