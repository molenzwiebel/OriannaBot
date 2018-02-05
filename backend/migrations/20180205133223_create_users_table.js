
exports.up = knex => knex.schema.createTable("users", table => {
    table.increments("id").primary();
    table.string("snowflake").notNullable();
    table.string("username").notNullable();
    table.string("avatar").notNullable();
    table.string("token").notNull();
});

exports.down = knex => knex.schema.dropTableIfExists("users");