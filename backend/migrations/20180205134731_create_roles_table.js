
exports.up = knex => knex.schema.createTable("roles", table => {
    table.increments("id").primary();
    table.integer("server_id").unsigned().references("id").inTable("servers").onDelete("cascade");
    table.string("name").notNullable();
    table.string("snowflake").notNullable();
    table.boolean("announce").notNullable();
});

exports.down = knex => knex.schema.dropTableIfExists("roles");