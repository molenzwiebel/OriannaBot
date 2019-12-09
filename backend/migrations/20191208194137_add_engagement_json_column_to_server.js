
exports.up = knex => knex.schema.table("servers", table => {
    table.string("engagement_json").notNullable().default(`{"type":"on_command"}`);
});

exports.down = knex => knex.schema.table("servers", table => {
    table.dropColumn("engagement_json");
});