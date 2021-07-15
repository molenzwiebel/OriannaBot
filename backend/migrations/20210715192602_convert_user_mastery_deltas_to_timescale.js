
exports.up = async knex => {
    if (await knex.schema.hasTable("user_mastery_deltas_ts")) {
        return;
    }

    // Create timescale table.
    await knex.schema.createTable("user_mastery_deltas_ts", table => {
        table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
        table.integer("champion_id").notNullable();
        table.integer("delta").notNullable();
        table.integer("value").notNullable();
        table.timestamp("timestamp", {
            useTz: false
        }).notNullable();

        table.index(["user_id", "champion_id"]);
    });

    // Make it a hypertable.
    await knex.raw(`SELECT create_hypertable('user_mastery_deltas_ts', 'timestamp');`);

    // Turn on compression.
    await knex.raw("ALTER TABLE user_mastery_deltas_ts SET (timescaledb.compress, timescaledb.compress_segmentby='user_id', timescaledb.compress_orderby='champion_id, timestamp desc');")
    await knex.raw("SELECT add_compression_policy('user_mastery_deltas_ts', INTERVAL '7 days');");
};

exports.down = knex => knex.schema.dropTableIfExists("user_mastery_deltas_ts");