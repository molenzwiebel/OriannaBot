
exports.up = knex => knex.schema.createTable("user_mastery_deltas", table => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
    table.integer("champion_id").notNullable();
    table.integer("delta").notNullable();
    table.integer("value").notNullable();
    table.bigInteger("timestamp").notNullable();

    table.index(["user_id", "champion_id"]);
});

exports.down = knex => knex.schema.dropTableIfExists("user_mastery_deltas");