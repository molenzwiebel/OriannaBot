use riven::consts::PlatformRoute;
use sqlx::{postgres::PgRow, types::Json, Row};

use crate::role_model::RoleCombinator;

#[derive(sqlx::FromRow, Debug)]
pub struct User {
    pub id: i32,
    pub snowflake: String,
    pub username: String,
    pub last_score_update_timestamp: i64,
    pub last_rank_update_timestamp: i64,
    pub last_account_update_timestamp: i64,
    pub treat_as_unranked: bool,
    pub ignore: bool,
    pub has_accounts: bool,
}

#[derive(sqlx::FromRow, Debug)]
pub struct UserChampionStat {
    pub id: i32,
    pub user_id: i32,
    pub champion_id: i32,
    pub level: i32,
    pub score: i32,
}

#[derive(sqlx::FromRow, Debug)]
pub struct UserRank {
    pub id: i32,
    pub user_id: i32,
    pub queue: String,
    pub tier: String,
}

#[derive(sqlx::FromRow, Debug)]
pub struct UserMasteryDelta {
    pub id: i32,
    pub user_id: i32,
    pub champion_id: i32,
    pub delta: i32,
    pub value: i32,
    pub timestamp: i64,
}

#[derive(sqlx::FromRow, Debug)]
pub struct Server {
    pub id: i32,
    pub snowflake: String,
    pub name: String,
    pub announcement_channel: Option<String>,
    pub nickname_pattern: String,
}

#[derive(Debug)]
pub struct ServerAndUserPresence {
    pub server: Server,
    pub roles: Json<Vec<String>>,
    pub nickname: Option<String>,
}

impl<'r> sqlx::FromRow<'r, PgRow> for ServerAndUserPresence {
    // Sqlx doesn't support #[sqlx(flatten)] (a PR to implement it has been stalled),
    // so we need to manually parse this struct for postgres by delegating to the auto-
    // generated implementation for server.
    fn from_row(row: &'r PgRow) -> Result<Self, sqlx::Error> {
        Ok(ServerAndUserPresence {
            server: <Server as sqlx::FromRow<'r, PgRow>>::from_row(row)?,
            roles: row.try_get("roles")?,
            nickname: row.try_get("nickname")?,
        })
    }
}

#[derive(sqlx::FromRow, Debug)]
pub struct Role {
    pub id: i32,
    pub name: String,
    pub snowflake: String,
    pub announce: bool,
    pub combinator: Json<RoleCombinator>,
}

#[derive(sqlx::FromRow, Debug)]
pub struct LeagueAccount {
    pub id: i32,
    pub user_id: i32,
    pub username: String,
    pub region: String,
    pub summoner_id: String,
    pub account_id: String,
    pub puuid: String,
    pub tft_summoner_id: String,
    pub tft_account_id: String,
    pub riot_id_game_name: Option<String>,
    pub riot_id_tagline: Option<String>,
    pub primary: bool,
    pub include_region: bool,
}

impl LeagueAccount {
    /// Convert the string representation of this account's region to a PlatformRoute.
    pub fn route(&self) -> Option<PlatformRoute> {
        let region = self.region.to_uppercase();
        let region = match region.as_str() {
            "PH" => "PH2",
            "SG" => "SG2",
            "TH" => "TH2",
            "TW" => "TW2",
            "VN" => "VN2",
            x => x,
        };

        region.parse().ok()
    }
}
