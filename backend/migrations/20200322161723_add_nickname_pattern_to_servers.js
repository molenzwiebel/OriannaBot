
exports.up = knex => knex.schema.table("servers", table => {
    table.string("nickname_pattern").notNullable().defaultTo("");
});

exports.down = knex => knex.schema.table("servers", table => {
    table.dropColumn("nickname_pattern");
});