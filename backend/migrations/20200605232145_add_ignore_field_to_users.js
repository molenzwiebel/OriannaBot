
exports.up = knex => knex.schema.table("users", table => {
    table.bool("ignore").defaultTo(false);
});

exports.down = knex => knex.schema.table("users", table => {
    table.dropColumn("ignore");
});