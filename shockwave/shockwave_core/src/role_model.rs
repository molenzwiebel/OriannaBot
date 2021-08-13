use std::ops::Deref;

use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(tag = "compare_type")]
#[serde(rename_all = "snake_case")]
pub enum RangeCondition {
    AtLeast { value: i32 },
    AtMost { value: i32 },
    Between { min: i32, max: i32 },
    Exactly { value: i32 },
}

#[derive(Deserialize, Debug)]
pub struct RoleConditionWithId {
    pub id: i32,
    pub role_id: i32,
    #[serde(flatten)]
    pub condition: RoleCondition,
}

impl Deref for RoleConditionWithId {
    type Target = RoleCondition;

    fn deref(&self) -> &Self::Target {
        &self.condition
    }
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type", content = "options")]
#[serde(rename_all = "snake_case")]
pub enum RoleCondition {
    MasteryLevel(MasteryLevelCondition),
    TotalMasteryLevel(TotalMasteryLevelCondition),
    MasteryScore(MasteryScoreCondition),
    TotalMasteryScore(TotalMasteryScoreCondition),
    RankedTier(RankedTierCondition),
    Server(ServerCondition),
}

#[derive(Deserialize, Debug)]
pub struct MasteryLevelCondition {
    #[serde(flatten)]
    pub range: RangeCondition,
    pub champion: i32,
}

#[derive(Deserialize, Debug)]
pub struct TotalMasteryLevelCondition {
    #[serde(flatten)]
    pub range: RangeCondition,
}

#[derive(Deserialize, Debug)]
pub struct MasteryScoreCondition {
    #[serde(flatten)]
    pub range: RangeCondition,
    pub champion: i32,
}

#[derive(Deserialize, Debug)]
pub struct TotalMasteryScoreCondition {
    #[serde(flatten)]
    pub range: RangeCondition,
}

#[derive(Deserialize, Debug)]
pub struct RankedTierCondition {
    #[serde(flatten)]
    pub compare: RankedTierCompare,
    pub queue: RankedTierQueue,
}

#[derive(Deserialize, Debug)]
#[serde(field_identifier)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RankedTierQueue {
    Any,
    #[serde(rename = "HIGHEST")]
    HighestExcludingTFT,
    #[serde(rename = "HIGHEST_TFT")]
    HighestIncludingTFT,
    NamedQueue(String),
}

#[derive(Deserialize, Debug)]
#[serde(tag = "compare_type", content = "tier")]
#[serde(rename_all = "snake_case")]
pub enum RankedTierCompare {
    Higher(i32),
    Lower(i32),
    Equal(i32),
}

#[derive(Deserialize, Debug)]
pub struct ServerCondition {
    pub region: String,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum RoleCombinator {
    All,
    Any,
    AtLeast { amount: i32 },
}
