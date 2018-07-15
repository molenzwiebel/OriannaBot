
exports.up = knex => knex.schema.table("users", table => {
    table.bigInteger("last_score_update_timestamp").defaultTo(0);
    table.bigInteger("last_rank_update_timestamp").defaultTo(0);
    table.bigInteger("last_account_update_timestamp").defaultTo(0);
});

exports.down = knex => knex.schema.table("users", table => {
    table.dropColumn("last_score_update_timestamp");
    table.dropColumn("last_rank_update_timestamp");
    table.dropColumn("last_account_update_timestamp");
});