
exports.up = knex => knex.schema.table("users", table => {
    table.string("language").notNullable().default("");
});

exports.down = knex => knex.schema.table("users", table => {
    table.dropColumn("language");
});