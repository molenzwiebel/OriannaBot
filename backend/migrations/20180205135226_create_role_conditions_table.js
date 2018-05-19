
exports.up = knex => knex.schema.createTable("role_conditions", table => {
    table.increments("id").primary();
    table.integer("role_id").unsigned().references("id").inTable("roles").onDelete("cascade");
    table.string("type").notNullable();
    table.json("options").notNullable();
    table.index(["role_id"]);
});

exports.down = knex => knex.schema.dropTableIfExists("role_conditions");