
exports.up = knex => knex.schema.createTable("blacklisted_channels", table => {
    table.integer("server_id").unsigned().references("id").inTable("servers").onDelete("cascade");
    table.string("snowflake").notNullable();
});

exports.down = knex => knex.schema.dropTableIfExists("blacklisted_channels");