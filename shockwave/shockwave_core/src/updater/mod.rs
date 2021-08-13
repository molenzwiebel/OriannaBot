use std::sync::Arc;

use futures::TryFutureExt;
use twilight_http::Client;

use crate::{database::Database, evaluate::EvaluationContext, riot_api::{Priority, RiotApiInterface}, util::DynError};

type UpdaterResult<T = ()> = Result<T, DynError>;

mod fetch;
mod update;

pub struct Updater {
    database: Arc<Database>,
    discord_client: Client,
    riot_interface: RiotApiInterface,
}

impl Updater {
    /// Creates a new updater that uses the given database.
    pub fn new(db: Arc<Database>, client: Client, riot: RiotApiInterface) -> Updater {
        Updater { database: db, discord_client: client, riot_interface: riot }
    }

    /// Attempt to fetch all information for the given evaluation context.
    /// This will discard any errors, and not update the user after the fetch.
    pub async fn fetch_all(&self, priority: Priority, ctx: &EvaluationContext) -> UpdaterResult {
        self.fetch_user_accounts(priority, ctx)
            .and_then(|_| self.fetch_mastery_scores(priority, ctx))
            .and_then(|_| self.fetch_user_ranks(priority, ctx))
            .await
    }
}
