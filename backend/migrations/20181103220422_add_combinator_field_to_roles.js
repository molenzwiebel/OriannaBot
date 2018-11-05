
exports.up = knex => knex.schema.table("roles", table => {
    table.json("combinator").defaultTo(`{"type":"all"}`);
});

exports.down = knex => knex.schema.table("roles", table => {
    table.dropColumn("combinator");
});