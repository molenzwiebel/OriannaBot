
exports.up = knex => knex.schema.table("servers", table => {
    table.string("language").notNullable().default("en-US");
});

exports.down = knex => knex.schema.table("servers", table => {
    table.dropColumn("language");
});