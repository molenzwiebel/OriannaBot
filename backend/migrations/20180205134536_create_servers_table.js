
exports.up = knex => knex.schema.createTable("servers", table => {
    table.increments("id").primary();
    table.string("snowflake").notNullable();
    table.string("name").notNullable();
    table.string("avatar").notNullable();
    table.string("announcement_channel").nullable();
    table.integer("default_champion").nullable();
    table.index(["snowflake"]);
});

exports.down = knex => knex.schema.dropTableIfExists("servers");