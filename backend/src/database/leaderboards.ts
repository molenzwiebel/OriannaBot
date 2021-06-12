import { knex } from "./index";
import StaticData from "../riot/static-data";
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
 * and the optional set of user ids to limit showing. Returns an object that
 * can be used for counting, ranks and actual lookup.
 */
export function createLeaderboardQuery(championId: string, only?: number[]) {
    const table = `leaderboard_${championId}`;

    const base = knex(table);
    if (only && only.length) {
        base.whereIn("user_id", only);
    }

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

            const whereClause = only && only.length ? `WHERE user_id IN (${only.join(", ")})` : "";
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
                .join("users", { "users.id": table + ".user_id" })
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