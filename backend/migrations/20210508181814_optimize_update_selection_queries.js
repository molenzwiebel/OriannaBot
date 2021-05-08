
exports.up = async knex => {
    // Add has_accounts field.
    await knex.schema.alterTable("users", table => {
        table.boolean("has_accounts").notNullable().default(false);
    });

    // Compute current value from nested.
    await knex.raw(`UPDATE users SET has_accounts=(SELECT count(*) FROM "league_accounts" as "accounts" WHERE "accounts"."user_id" = "users"."id") > 0;`);

    // Add indices.
    await knex.raw(`CREATE INDEX last_score_update_timestamp_idx ON users USING btree (last_score_update_timestamp ASC NULLS LAST, has_accounts);`);
    await knex.raw(`CREATE INDEX last_account_update_timestamp_idx ON users USING btree (last_account_update_timestamp ASC NULLS LAST, has_accounts);`);
    await knex.raw(`CREATE INDEX last_rank_update_timestamp_idx ON users USING btree (last_rank_update_timestamp ASC NULLS LAST, has_accounts);`);
};

exports.down = knex => knex.schema.alterTable("users", table => {
    table.dropColumn("users");
    table.dropIndex([
        "last_score_update_timestamp_idx",
        "last_account_update_timestamp_idx",
        "last_rank_update_timestamp_idx"
    ]);
});