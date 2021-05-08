
exports.up = knex => knex.schema.alterTable("servers", table => {
    table.jsonb("engagement_json").notNullable().default(`{"type":"on_command"}`).alter();
});

exports.down = knex => knex.schema.alterTable("servers", table => {
    table.string("engagement_json").notNullable().default(`{"type":"on_command"}`).alter();
});