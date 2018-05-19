
exports.up = knex => knex.schema.createTable("user_auth_keys", table => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
    table.string("key").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index(["key"]);
});

exports.down = knex => knex.schema.dropTableIfExists("user_auth_keys");