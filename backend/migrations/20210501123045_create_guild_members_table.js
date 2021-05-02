
exports.up = knex => knex.schema.createTable("guild_members", table => {
    table.bigInteger("guild_id").notNullable();
    table.bigInteger("user_id").notNullable();
    table.text("nickname");
    table.jsonb("roles");

    table.unique(["guild_id", "user_id"]);

    table.index(["guild_id", "user_id"], "guild_members_guild_id_user_id_idx");
    table.index(["user_id"]);
    table.index(["guild_id"]);
});

exports.down = knex => knex.schema.dropTableIfExists("guild_members");