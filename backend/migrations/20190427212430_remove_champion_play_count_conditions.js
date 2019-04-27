
// Delete all conditions of type champion_play_count.
exports.up = knex => knex.from("role_conditions").where("type", "champion_play_count").delete();

exports.down = knex => {}; // can't reverse this