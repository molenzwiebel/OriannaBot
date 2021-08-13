use std::collections::HashSet;

use futures::FutureExt;
use tracing::{debug, info, instrument, warn, Instrument};
use twilight_http::request::AuditLogReason;
use twilight_model::id::{GuildId, UserId};

use super::{Updater, UpdaterResult};
use crate::{db_model::ServerAndUserPresence, evaluate::EvaluationContext, orianna};

impl Updater {
    /// **Update**s the user with the given user id. This will recalulate and
    /// possibly update the roles for the user on all of the guilds we share
    /// with them, but will not fetch any new data. This should be invoked after
    /// the user has been updated with new data (and possibly when things like
    /// the configured roles in a server have been changed).
    #[instrument(skip(self))]
    pub async fn update_user(&self, user_id: i32) -> UpdaterResult {
        debug!("Updating user with ID {}", user_id);

        let ctx = self.database.get_evaluation_context(user_id).await?;

        // If the user was set to ignore in the database, prevent us
        // from ever doing an update on them.
        if ctx.user.ignore {
            return Ok(());
        }

        let servers = self.database.get_servers_with_user(ctx.user.snowflake.clone()).await?;

        // Simply update on each server in parallel.
        futures::future::join_all(servers.iter().map(|x| self.update_user_on_server(&ctx, &x))).await;

        Ok(())
    }

    /// Given the specific server membership and evaluation context for the
    /// given user, **update**s them on the given server by recomputing their
    /// roles and possibly updating their nickname.
    #[instrument(skip(self, ctx, membership))]
    async fn update_user_on_server(
        &self,
        ctx: &EvaluationContext,
        membership: &ServerAndUserPresence,
    ) -> UpdaterResult {
        debug!(
            "Updating user {} ({}) on server {} ({})",
            ctx.user.username, ctx.user.snowflake, membership.server.name, membership.server.snowflake
        );

        let conditions = self.database.get_roles_and_conditions_for_server(membership.server.id).await?;

        let mut should_have = HashSet::<String>::new();
        let mut should_be_removed = HashSet::<String>::new();

        for (role, conditions) in &conditions {
            // Skip roles that don't seem to look like a snowflake.
            if role.snowflake.is_empty() || !role.snowflake.chars().all(char::is_numeric) {
                continue;
            }

            let applies = role.evaluate(conditions.iter().collect(), &ctx);

            if applies {
                should_have.insert(role.snowflake.clone());
            } else {
                should_be_removed.insert(role.snowflake.clone());
            }
        }

        // Compute the roles we should remove.
        should_be_removed = should_be_removed.difference(&should_have).cloned().collect();

        let guild_id: GuildId = membership.server.snowflake.parse::<u64>()?.into();
        let user_id: UserId = ctx.user.snowflake.parse::<u64>()?.into();

        // Remove what we shouldn't have.
        futures::future::join_all(should_be_removed.iter().filter_map(|to_be_removed| {
            if !membership.roles.0.contains(&to_be_removed) {
                return None;
            }

            info!("Removing role {}", to_be_removed);

            // ignore error, likely means something is wrong with permissions
            Some(
                self.discord_client
                    .remove_guild_member_role(guild_id, user_id, to_be_removed.parse::<u64>().ok()?.into())
                    .reason("Orianna: User no longer qualifies for role")
                    .ok()?
                    .instrument(tracing::info_span!("remove_guild_member_role")),
            )
        }))
        .await;

        // Add what we should have.
        futures::future::join_all(should_have.iter().filter_map(|to_be_added| {
            if membership.roles.0.contains(&to_be_added) {
                return None;
            }

            info!("Adding role {}", to_be_added);

            let role = &conditions
                .iter()
                .find(|x| x.0.snowflake == to_be_added.clone())
                .expect("Role somehow does not show up in conditions.")
                .0;

            // ignore error, likely means something is wrong with permissions
            Some(
                self.discord_client
                    .add_guild_member_role(guild_id, user_id, to_be_added.parse::<u64>().ok()?.into())
                    .reason("Orianna: User qualifies for role")
                    .ok()?
                    .instrument(tracing::info_span!("add_guild_member_role"))
                    .map(move |result| {
                        let succeeded = result.is_ok();

                        if !succeeded {
                            warn!("Failed to give role {} to user {}: {:?}", role.snowflake, user_id, result);
                        }

                        if succeeded && role.announce {
                            debug!("Requesting promotion announcement for {}", role.name);
                            return orianna::announce_promotion(ctx.user.id, role.id).boxed();
                        }

                        return futures::future::ready(()).boxed();
                    }),
            )
        }))
        .await;

        // Check whether the user's nickname is appropriate.
        if !membership.server.nickname_pattern.is_empty() {
            if let Some(primary_account) = ctx.accounts.iter().find(|x| x.primary) {
                let target_nick = Some(
                    membership
                        .server
                        .nickname_pattern
                        .replace("{region}", &primary_account.region)
                        .replace("{username}", &primary_account.username)
                        .chars()
                        .take(32)
                        .collect::<String>(),
                );

                // if the user's nick isn't already this nick, try assigning
                if membership.nickname != target_nick {
                    info!("Updating user nickname to {:?}", target_nick);

                    let _ = self
                        .discord_client
                        .update_guild_member(guild_id, user_id)
                        .nick(target_nick)?
                        .reason("Orianna: Updating nickname to match server pattern.")?
                        .instrument(tracing::info_span!("update_guild_member"))
                        .await;
                }
            } else {
                // We have a nickname pattern but not a primary account. This means we should reset
                // their nickname since the nickname may be stale (and the server may be configured
                // to prevent users from manually assigning nicknames).
                if membership.nickname.is_some() {
                    info!("Removing user nickname from {:?}", membership.nickname);

                    let _ = self
                        .discord_client
                        .update_guild_member(guild_id, user_id)
                        .nick(None)?
                        .reason("Orianna: Removing nickname since user has no accounts linked.")?
                        .instrument(tracing::info_span!("update_guild_member"))
                        .await;
                }
            }
        }

        Ok(())
    }
}
