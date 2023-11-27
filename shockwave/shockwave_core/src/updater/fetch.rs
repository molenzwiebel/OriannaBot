use std::collections::HashMap;

use futures::future;
use itertools::Itertools;
use reqwest::StatusCode;
use riven::consts::{QueueType, Tier};
use tracing::{debug, instrument};

use super::{Updater, UpdaterResult};
use crate::{database::BatchQueryBuilder, evaluate::EvaluationContext, orianna, riot_api::Priority, util::HashMapExt};

impl Updater {
    /// Updates/upserts the mastery values for the given user in the database.
    /// This will fetch the current mastery for the user and the current mastery
    /// from the Riot API, then compute totals and update accordingly. This operation
    /// solely updates the in-memory representation of the user and does not recompute
    /// roles for the user (use `update_user` for that).
    #[instrument(skip(self, ctx))]
    pub async fn fetch_mastery_scores(&self, priority: Priority, ctx: &EvaluationContext) -> UpdaterResult {
        let user_id = ctx.user.id;
        debug!("Fetching mastery scores for user {}", user_id);

        // champion ID to (level, score)
        let old_stats = ctx.stats.iter().map(|x| (x.champion_id, (x.level, x.score))).collect::<HashMap<_, _>>();
        let mut new_stats = HashMap::<i32, (i32, i32)>::new();

        // fetch account statistics in parallel, error if one of them errors
        let account_stats = self.riot_interface.get_champion_mastery_scores(priority, &ctx.accounts).await?;

        let mut connection = self.database.get_connection().await?;

        // merge stats
        for account_stats in account_stats {
            for stat in account_stats {
                new_stats
                    .entry(stat.champion_id.0 as i32)
                    .and_modify(|(level, points)| {
                        *level = (*level).max(stat.champion_level);
                        *points += stat.champion_points;
                    })
                    .or_insert((stat.champion_level, stat.champion_points));
            }
        }

        let mut leaderboard_builder = BatchQueryBuilder::new();

        // If we previously had some stats and now we have none, we also need to nuke the user
        // from the all-time leaderboard.
        if !ctx.stats.is_empty() && new_stats.is_empty() {
            debug!("User has no accounts linked but still had stats in the database, nuking 'all' leaderboard.");
            leaderboard_builder.remove_user_from_leaderboard(user_id, "all");
        }

        // Compute the difference between what we have in the database and what we just
        // pulled from the Riot API. This returns a set of entries for each of the three
        // categories.
        let (to_be_removed, to_be_updated, to_be_added) = old_stats.difference(new_stats);

        // Remove leaderboard entries for stale stats.
        if !to_be_removed.is_empty() {
            for (champion_id, _) in &to_be_removed {
                debug!("User no longer has stats on {:?}", riven::consts::Champion(*champion_id as i16).name());
                leaderboard_builder.remove_user_from_leaderboard(user_id, &champion_id.to_string());
            }

            self.database
                .remove_user_stats_for_champions(
                    &mut connection,
                    user_id,
                    &to_be_removed.keys().copied().collect::<Vec<_>>(),
                )
                .await?;
        }

        let mut values_to_be_upserted = vec![];
        let mut deltas_to_be_inserted = vec![];

        // For champions that already existed, only update those where the score differs.
        // We need to upsert those, as well as insert user mastery deltas for them.
        for (champ_id, ((old_level, old_points), (new_level, new_points))) in to_be_updated {
            if old_level == new_level && old_points == new_points {
                continue;
            }

            debug!(
                "User points are different for {:?} (delta {})",
                riven::consts::Champion(champ_id as i16).name(),
                new_points - old_points
            );

            // Update both leaderboard and score entry for this user, and insert a delta.
            values_to_be_upserted.push((champ_id, new_level, new_points));
            deltas_to_be_inserted.push((champ_id, new_points, new_points - old_points));
        }

        // For new entries we only need to upsert values in leaderboard and stats.
        for (champ_id, (level, points)) in to_be_added {
            debug!("User now has stats on {:?}", riven::consts::Champion(champ_id as i16).name());

            values_to_be_upserted.push((champ_id, level, points));
        }

        // Batch upsert all stats.
        self.database.upsert_user_stats(&mut connection, user_id, &values_to_be_upserted).await?;

        // Parallel update all leaderboards.
        for to_update in &values_to_be_upserted {
            leaderboard_builder.upsert_user_in_leaderboard(user_id, to_update.0.to_string(), *to_update);
        }

        // Batch upsert all deltas.
        self.database.insert_user_mastery_deltas(&mut connection, user_id, &deltas_to_be_inserted).await?;

        // Finally, update the overall leaderboard. Note that we only need to concern us
        // with the entries in `values_to_be_upserted` here.
        if !values_to_be_upserted.is_empty() {
            let max_entry = values_to_be_upserted.iter().max_by_key(|x| x.2).expect("No results in a non-empty vec?");
            let old_max_entry = ctx.stats.iter().max_by_key(|x| x.score);

            // Note that `values_to_be_upserted` only contains values that changed right now. We can't
            // simply select the max one as they may have a better champ that they didn't play recently.
            // As a result, we first need to check if this value is actually better than the old max (or
            // the old max didn't exist, either works).
            if !old_max_entry.is_some() || old_max_entry.unwrap().score < max_entry.2 {
                debug!(
                    "Values were updated, so updating all leaderboard to be {:?} with {} points",
                    riven::consts::Champion(max_entry.0 as i16).name(),
                    max_entry.2
                );

                leaderboard_builder.upsert_user_in_leaderboard(user_id, "all".to_string(), *max_entry);
            } else {
                debug!("Values were updated, but no changes were made to the user's highest mastery");
            }
        }

        // Finally, commit all changes to the leaderboard.
        leaderboard_builder.execute(&mut connection).await?;

        self.database
            .update_fetch_timestamp_with_connection(&mut connection, user_id, "last_score_update_timestamp")
            .await?;

        Ok(())
    }

    /// Updates/upserts the set of ranked tiers for the given user. This will
    /// only update their current entries in the database and will not change
    /// any roles (to do so, follow a call to this with a call to update).
    #[instrument(skip(self, ctx))]
    pub async fn fetch_user_ranks(&self, priority: Priority, ctx: &EvaluationContext) -> UpdaterResult {
        let user_id = ctx.user.id;
        debug!("Fetching ranked tiers for user {}", user_id);

        let lol_ranks = self.riot_interface.get_lol_league_entries(priority, &ctx.accounts).await?;
        let tft_ranks = self.riot_interface.get_tft_league_entries(priority, &ctx.accounts).await?;

        // Combine the LoL and TFT ranks and find the highest rank in each queue.
        // Turn that into a hashmap that maps the queue to the tier within that queue.
        let all_new_ranks: HashMap<_, _> = lol_ranks
            .into_iter()
            .chain(tft_ranks.into_iter())
            .sorted_by_key(|x| <&'static str>::from(x.clone().0))
            .group_by(|x| x.clone().0)
            .into_iter() // group_by needs an iterator
            .map(|(k, v)| (k, v.max_by_key(|x| x.1).unwrap().1)) // for each queue, select the best object in the queue
            .collect();

        // Do the same transformation for the old ranks, attempting to parse them and
        // map them into a hashmap so we can do a diff on them later.
        let all_old_ranks: HashMap<_, _> = ctx
            .ranks
            .iter()
            .filter_map(|x| match (x.queue.parse::<QueueType>(), x.tier.parse::<Tier>()) {
                (Ok(queue), Ok(tier)) => Some((queue, tier)),
                _ => None,
            })
            .collect();

        let (to_be_removed, to_be_updated, to_be_added) = all_old_ranks.difference(all_new_ranks);
        debug!("Ranks to be removed from the database: {:#?}", to_be_removed);
        debug!("Ranks to be compared and potentially updated with the database: {:#?}", to_be_updated);
        debug!("Ranks to be added to the database: {:#?}", to_be_added);

        // Convert each of these into futures to perform the appropriate database accesses.
        let removal_futures = to_be_removed.into_iter().map(|x| self.database.remove_user_rank(user_id, x.0.into()));
        let update_futures = to_be_updated
            .into_iter()
            .filter(|x| x.1 .0 != x.1 .1)
            .map(|x| self.database.update_user_rank(user_id, x.0.into(), x.1 .1.into()));
        let added_futures =
            to_be_added.into_iter().map(|x| self.database.insert_user_rank(user_id, x.0.into(), x.1.into()));

        // Run all of em at the same time
        futures::try_join!(
            future::try_join_all(removal_futures),
            future::try_join_all(update_futures),
            future::try_join_all(added_futures),
        )?;

        self.database.update_fetch_timestamp(user_id, "last_rank_update_timestamp").await?;

        Ok(())
    }

    /// Updates/upserts the Riot API data for the accounts owned by the
    /// specified user. This will re-query the API to ensure that the user
    /// still owns their account and that their username has not changed.
    #[instrument(skip(self, ctx))]
    pub async fn fetch_user_accounts(&self, priority: Priority, ctx: &EvaluationContext) -> UpdaterResult {
        let user_id = ctx.user.id;
        debug!("Fetching user accounts for user {}", user_id);

        // For each account, check whether the account still exists.
        for account in &ctx.accounts {
            let account_data = self.riot_interface.get_summoner(priority, account).await?;

            match account_data {
                Err(e) if e.status_code() == Some(StatusCode::NOT_FOUND) => {
                    // Account no longer exists, the user likely transfered.
                    debug!("Account {} no longer exists", account.username);

                    self.database.remove_account(user_id, account.id).await?;
                    orianna::message_transfer(user_id, &account.region, &account.username).await;
                },
                Err(_) => continue, // riot api issue
                Ok(_) => {
                    // account still good
                    debug!("No summoner changes for account {}", account.username);
                },
            };

            // and update their Riot ID name, if it has changed
            let riot_id_data = self.riot_interface.get_riot_id(priority, account).await;
            match riot_id_data {
                Err(_) => continue, // riot api issue
                Ok(data) => {
                    if data.game_name == account.riot_id_game_name && data.tag_line == account.riot_id_tagline {
                        debug!("No changes to Riot ID for account {}", account.username);
                        continue;
                    }

                    debug!(
                        "Riot ID for account {} changed from {:?}#{:?} to {:?}#{:?}",
                        account.username,
                        account.riot_id_game_name,
                        account.riot_id_tagline,
                        data.game_name,
                        data.tag_line
                    );

                    self.database.update_account_riot_id(account.id, data.game_name, data.tag_line).await?;
                },
            };
        }

        self.database.update_fetch_timestamp(user_id, "last_account_update_timestamp").await?;

        Ok(())
    }
}
