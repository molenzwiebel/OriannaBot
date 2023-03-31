import StaticData from "../riot/static-data";
import { knex } from "./index";
import debug = require("debug");

const info = debug("orianna:database:leaderboards");

/**
 * Create a new leaderboard table for the given identifier (which should
 * either be the numeric ID for the champion, or the string "all"). Note
 * that the table will be empty and will not be backfilled for stats currently
 * in the user_champion_stats table.
 */
export async function createLeaderboardTable(identifier: string) {
    if (await knex.schema.hasTable(`leaderboard_${identifier}`)) {
        return;
    }

    info("Creating leaderboard table %s", identifier);

    await knex.schema.createTable(`leaderboard_${identifier}`, table => {
        table.integer("user_id").unsigned().references("id").inTable("users").onDelete("cascade");
        table.integer("level").notNullable();
        table.integer("score").notNullable();
        table.integer("champion_id").notNullable();

        table.unique(["user_id"], `leaderboard_${identifier}_user_index`);
    });

    await knex.raw(`CREATE INDEX IF NOT EXISTS leaderboard_${identifier}_score_index ON leaderboard_${identifier} USING btree (score ASC NULLS LAST);`);
}

/**
 * Attempts to create leaderboard tables for all of the champions in
 * the specified static data instance.
 */
export async function initializeLeaderboardTables(data: StaticData) {
    const champs = await data.getAllChampions();
    for (const champ of champs) {
        await createLeaderboardTable(champ.key);
    }
    await createLeaderboardTable("all");
}

/**
 * Create a leaderboard query instance for the given champion ID (or "all")
 * and an optional guild ID to limit the results to.
 */
export function createLeaderboardQuery(championId: string, limitToGuild: {
    id: string;
    requiredRoleId: string | null;
} | null) {
    const table = `leaderboard_${championId}`;

    let base = knex("users");
    if (limitToGuild) {
        // if we're limited to a guild, join on the guild_members table and only
        // select those that are in the guild.
        base = base
            .join("guild_members", { "users.snowflake": knex.raw("guild_members.user_id::text") })
            .where("guild_members.guild_id", limitToGuild.id);

        if (limitToGuild.requiredRoleId) {
            base = base.where("guild_members.roles", "?", limitToGuild.requiredRoleId);
        }
    }

    // join from users to the leaderboard table
    base = base
        .join(table, { "users.id": table + ".user_id" });

    return {
        // Get the total number of results.
        async count(): Promise<number> {
            return base.clone().count().then(x => x[0].count as number);
        },
        // Get the rank of the user. Returns null if
        // they are not in the table, or returns false
        // if they are above the maximum.
        async rank(user_id: number, max = 10_000): Promise<number | null | false> {
            const exists = await knex(table).where("user_id", user_id).first();
            if (!exists) return null;

            // enjoy the sql spaghetti
            const whereRoleClause = limitToGuild && limitToGuild.requiredRoleId ? ` AND ('${limitToGuild.requiredRoleId}' = ANY(SELECT jsonb_array_elements_text(guild_members.roles)))` : "";
            const whereClause = limitToGuild ? `WHERE user_id IN (SELECT users.id FROM users JOIN guild_members ON guild_members.user_id::text = users.snowflake WHERE guild_members.guild_id = '${limitToGuild.id}'${whereRoleClause})` : "";
            const result = await knex.raw(
                `SELECT rank FROM (SELECT user_id, RANK() OVER(ORDER BY score DESC) FROM ${table} ${whereClause} LIMIT ?) x WHERE user_id = ?`,
                [max, user_id]
            );

            if (!result.rows.length) {
                return false;
            }

            return +result.rows[0].rank;
        },
        // Retrieve the set of results for the given range and return
        // the list of user IDs.
        async range(from: number, to: number): Promise<{
            snowflake: string,
            username: string,
            avatar: string,

            champion_id: number,
            score: number,
            level: number
        }[]> {
            return base
                .clone()
                .orderBy("score", "DESC")
                .limit(to - from)
                .offset(from)
                .select(
                    "users.snowflake",
                    "users.username",
                    "users.avatar",
                    "champion_id",
                    "score",
                    "level"
                );
        }
    };
}