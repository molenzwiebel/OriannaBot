use futures::{future, FutureExt};
use rand::prelude::SliceRandom;
use riven::{
    consts::{QueueType, RegionalRoute, Tier},
    models::{account_v1, champion_mastery_v4::ChampionMastery, summoner_v4::Summoner},
    Result as RivenResult, RiotApi, RiotApiConfig,
};

use crate::{db_model::LeagueAccount, util::DynError};

/// Helper wrapper for `RiotApi` that will dispatch
/// calls to either the updater or the priority instance
/// based on the type of `Priority` passed in.
pub struct RiotApiInterface {
    updater_lol_api_client: RiotApi,
    updater_tft_api_client: RiotApi,

    priority_lol_api_client: RiotApi,
    priority_tft_api_client: RiotApi,
}

/// A priority that represents which Riot API instance should
/// be used to make calls.
#[derive(Clone, Copy, Debug)]
pub enum Priority {
    /// The updater API client. This client can be saturated by
    /// rate limits and is likely not going to be used immediately.
    Updater,

    /// The prioritized user action API client. Shockwave will reserve
    /// some rate limits for this client and will use it to make calls
    /// that should resolve as soon as possible.
    UserAction,
}

static UPDATER_RATE_LIMIT_PCT: f32 = 0.9;
static USER_ACTION_RATE_LIMIT_PCT: f32 = 0.1;

type Result<T = ()> = std::result::Result<T, DynError>;

impl RiotApiInterface {
    pub fn new(lol_api_key: &str, tft_api_key: &str) -> RiotApiInterface {
        RiotApiInterface {
            updater_lol_api_client: RiotApi::new(
                RiotApiConfig::with_key(lol_api_key).set_rate_usage_factor(UPDATER_RATE_LIMIT_PCT),
            ),
            updater_tft_api_client: RiotApi::new(
                RiotApiConfig::with_key(tft_api_key).set_rate_usage_factor(USER_ACTION_RATE_LIMIT_PCT),
            ),
            priority_lol_api_client: RiotApi::new(
                RiotApiConfig::with_key(lol_api_key).set_rate_usage_factor(UPDATER_RATE_LIMIT_PCT),
            ),
            priority_tft_api_client: RiotApi::new(
                RiotApiConfig::with_key(tft_api_key).set_rate_usage_factor(USER_ACTION_RATE_LIMIT_PCT),
            ),
        }
    }

    /// Retrieve all the league entries for the given accounts. Note that this
    /// may return multiple entries for the same queue if the user has more than
    /// one account.
    pub async fn get_lol_league_entries(
        &self,
        priority: Priority,
        accounts: &Vec<LeagueAccount>,
    ) -> Result<Vec<(QueueType, Tier)>> {
        Ok(future::try_join_all(accounts.iter().filter_map(|account| {
            account.route().map(|region| {
                self.lol_client(priority).league_v4().get_league_entries_for_summoner(region, &account.summoner_id)
            })
        }))
        .await?
        .into_iter()
        .flatten()
        .flat_map(|x| x.tier.map(|t| (x.queue_type, t)))
        .collect())
    }

    /// Retrieve all the TFT entries for the given accounts. Note that this
    /// may return multiple entries for the same queue if the user has more than
    /// one account. Does not return hyperroll queues, since they have a different
    /// concept of tiers.
    pub async fn get_tft_league_entries(
        &self,
        priority: Priority,
        accounts: &Vec<LeagueAccount>,
    ) -> Result<Vec<(QueueType, Tier)>> {
        Ok(future::try_join_all(accounts.iter().filter_map(|account| {
            let Some(route) = account.route() else {
                return None;
            };

            Some(
                self.tft_client(priority)
                    .tft_league_v1()
                    .get_league_entries_for_summoner(route, &account.summoner_id)
                    .map(|x| x.map(|x| x.into_iter().filter(|x| x.tier.is_some()).collect::<Vec<_>>())),
            )
        }))
        .await?
        .into_iter()
        .flatten()
        .map(|x| (x.queue_type, x.tier.unwrap()))
        .collect())
    }

    /// Returns the set of champion mastery scores for the given users.
    /// Note that multiple entries for the same champion may exist, since
    /// this does not process the data in any way.
    pub async fn get_champion_mastery_scores(
        &self,
        priority: Priority,
        accounts: &Vec<LeagueAccount>,
    ) -> Result<Vec<Vec<ChampionMastery>>> {
        Ok(future::try_join_all(accounts.iter().filter_map(|account| {
            account.route().map(|region| {
                self.lol_client(priority).champion_mastery_v4().get_all_champion_masteries(region, &account.summoner_id)
            })
        }))
        .await?)
    }

    /// Attempts to retrieve the summoner for the given account. Note
    /// that this returns a double result: the first result is solely to
    /// indicate whether we could even load the summoner (region parsing),
    /// while the second result indicates the result of actually calling
    /// the API (we expose this for more complex logic).
    pub async fn get_summoner(&self, priority: Priority, account: &LeagueAccount) -> Result<RivenResult<Summoner>> {
        let Some(region) = account.route() else {
            return Err("Could not parse region".into());
        };

        Ok(self.lol_client(priority).summoner_v4().get_by_summoner_id(region, &account.summoner_id).await)
    }

    /// Attempt to retrieve the full Riot ID for the given account.
    pub async fn get_riot_id(&self, priority: Priority, account: &LeagueAccount) -> RivenResult<account_v1::Account> {
        // Select a random cluster from ["americas", "asia", "europe"] which should, over enough time,
        // provide a roughly equal distribution of requests and as a result a roughly equal distribution
        // of rate limit usage.
        let mut rng = rand::thread_rng();
        let cluster = [RegionalRoute::AMERICAS, RegionalRoute::ASIA, RegionalRoute::EUROPE].choose(&mut rng).unwrap();

        self.lol_client(priority).account_v1().get_by_puuid(*cluster, &account.puuid).await
    }

    /// Helper function to return the appropriate LOL client for the given priority.
    fn lol_client(&self, priority: Priority) -> &RiotApi {
        match priority {
            Priority::Updater => &self.updater_lol_api_client,
            Priority::UserAction => &self.priority_lol_api_client,
        }
    }

    /// Helper function to return the appropriate TFT client for the given priority.
    fn tft_client(&self, priority: Priority) -> &RiotApi {
        match priority {
            Priority::Updater => &self.updater_tft_api_client,
            Priority::UserAction => &self.priority_tft_api_client,
        }
    }
}
