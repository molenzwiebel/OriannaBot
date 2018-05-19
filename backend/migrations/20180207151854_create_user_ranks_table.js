
exports.up = knex => knex.schema.createTable("user_ranks", table => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
    table.string("queue").notNullable();
    table.string("tier").notNullable();
    table.index(["user_id"]);
});

exports.down = knex => knex.schema.dropTableIfExists("user_ranks");