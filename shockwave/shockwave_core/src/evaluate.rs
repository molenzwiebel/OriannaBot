use std::ops::Deref;

use crate::{
    db_model::{LeagueAccount, Role, User, UserChampionStat, UserRank},
    role_model::{
        MasteryLevelCondition, MasteryScoreCondition, RangeCondition, RankedTierCompare, RankedTierCondition,
        RankedTierQueue, RoleCombinator, RoleCondition, ServerCondition, TotalMasteryLevelCondition,
        TotalMasteryScoreCondition,
    },
};

const TIERS: [&'static str; 9] =
    ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];

/// Helper function that converts the specified tier to
/// a numeric index, where unknown tiers are mapped as -1.
fn tier_to_numeric(tier: &str) -> i32 {
    match TIERS.iter().position(|&x| x == tier) {
        Some(i) => (i + 1) as i32, // unranked = 0
        None => -1,
    }
}

/// Represents the necessary information needed to evaluate
/// whether a user is applicable to receive a certain role.
#[derive(Debug)]
pub struct EvaluationContext {
    pub user: User,
    pub accounts: Vec<LeagueAccount>,
    pub stats: Vec<UserChampionStat>,
    pub ranks: Vec<UserRank>,
}

impl Role {
    /// For the given set of role conditions and the given evaluation
    /// context, check if this role applies to the given user, using
    /// the combinator configured for this role.
    pub fn evaluate<T>(&self, conditions: Vec<&T>, ctx: &EvaluationContext) -> bool
    where
        T: Deref<Target = RoleCondition>,
    {
        let matching = conditions.iter().filter(|x| x.evaluate(ctx)).count();

        match *self.combinator {
            RoleCombinator::All => matching == conditions.len(),
            RoleCombinator::Any => matching > 0,
            RoleCombinator::AtLeast { amount } => matching >= amount as usize,
        }
    }
}

impl RangeCondition {
    /// Evaluate the current range condition on the given value.
    pub fn evaluate(&self, val: i32) -> bool {
        match *self {
            RangeCondition::AtLeast { value } => val >= value,
            RangeCondition::AtMost { value } => val <= value,
            RangeCondition::Between { min, max } => val >= min && val <= max,
            RangeCondition::Exactly { value } => val == value,
        }
    }
}

impl RankedTierCompare {
    /// Evaluate the given tier on this ranked tier constraint.
    /// Returns false if the given tier is not defined in the
    /// static list of tiers, which should rarely happen.
    pub fn evaluate(&self, tier: &str) -> bool {
        // Attempt to convert the ranked tier to an index.
        let idx = match TIERS.iter().position(|&x| x == tier) {
            Some(i) => (i + 1) as i32, // unranked = 0
            None => return false,
        };

        match *self {
            RankedTierCompare::Higher(val) => val < idx,
            RankedTierCompare::Lower(val) => val > idx,
            RankedTierCompare::Equal(val) => val == idx,
        }
    }

    /// Return whether this pattern is Equal(0)
    pub fn is_equals_zero(&self) -> bool {
        matches!(self, RankedTierCompare::Equal(0))
    }
}

impl RoleCondition {
    /// Returns whether evaluating this role condition requires
    /// knowing what accounts a user has linked to their profile.
    pub fn needs_accounts(&self) -> bool {
        match self {
            RoleCondition::Server(_) => true,
            _ => false,
        }
    }

    /// Returns whether evaluating this role condition requires
    /// knowing the ranked tiers of the user.
    pub fn needs_ranked_tiers(&self) -> bool {
        match self {
            RoleCondition::RankedTier(_) => true,
            _ => false,
        }
    }

    /// Returns whether evaluating this role condition requires
    /// knowing the mastery statistics of the user.
    pub fn needs_mastery(&self) -> bool {
        match self {
            RoleCondition::MasteryLevel(_) => true,
            RoleCondition::TotalMasteryLevel(_) => true,
            RoleCondition::MasteryScore(_) => true,
            RoleCondition::TotalMasteryScore(_) => true,
            _ => false,
        }
    }

    /// Given the specified evaluation context, evaluate whether
    /// the current condition applies to the user.
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        match self {
            RoleCondition::MasteryLevel(x) => x.evaluate(ctx),
            RoleCondition::TotalMasteryLevel(x) => x.evaluate(ctx),
            RoleCondition::MasteryScore(x) => x.evaluate(ctx),
            RoleCondition::TotalMasteryScore(x) => x.evaluate(ctx),
            RoleCondition::RankedTier(x) => x.evaluate(ctx),
            RoleCondition::Server(x) => x.evaluate(ctx),
        }
    }
}

impl MasteryLevelCondition {
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        let level = ctx.stats.iter().find(|&x| x.champion_id == self.champion).map_or(0, |x| x.level);

        self.range.evaluate(level)
    }
}

impl TotalMasteryLevelCondition {
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        let total_level = ctx.stats.iter().map(|x| x.level).sum();

        self.range.evaluate(total_level)
    }
}

impl MasteryScoreCondition {
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        let score = ctx.stats.iter().find(|&x| x.champion_id == self.champion).map_or(0, |x| x.score);

        self.range.evaluate(score)
    }
}

impl TotalMasteryScoreCondition {
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        let total_score = ctx.stats.iter().map(|x| x.score).sum();

        self.range.evaluate(total_score)
    }
}

impl RankedTierCondition {
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        // if the user has no accounts (no ranks), they should not be eligible for anything
        // this is mostly the case for Unranked users, which should really not have a role
        // assigned to them if they have no accounts linked
        if ctx.ranks.is_empty() {
            return false;
        }

        match &self.queue {
            RankedTierQueue::HighestExcludingTFT | RankedTierQueue::HighestIncludingTFT => {
                let include_tft = matches!(self.queue, RankedTierQueue::HighestIncludingTFT);

                // Find the user's highest queue, filtering out TFT if needed.
                let highest = ctx
                    .ranks
                    .iter()
                    .filter(|&x| include_tft || x.queue != "RANKED_TFT")
                    .max_by_key(|&x| tier_to_numeric(&x.tier));

                // If the user has no rank, or if they are marked as unranked,
                // this condition only matches if this is an explicit Equals(UNRANKED)
                // check. This ensures that we don't include UNRANKED in less-than or
                // higher-than comparisons (i.e. we don't want to treat it as a tier
                // below iron).
                match (highest, ctx.user.treat_as_unranked) {
                    (None, _) | (_, true) => self.compare.is_equals_zero(),
                    (Some(rank), _) => self.compare.evaluate(&rank.tier),
                }
            },
            RankedTierQueue::Any => {
                // If the user should be treated as unranked, only apply this
                // if we're equals(0).
                if ctx.user.treat_as_unranked {
                    return self.compare.is_equals_zero();
                }

                // Check if any rank applies.
                ctx.ranks.iter().any(|x| self.compare.evaluate(&x.tier))
            },
            RankedTierQueue::NamedQueue(queue) => {
                let rank = ctx.ranks.iter().find(|&x| x.queue == *queue);

                // Same thing here. Not found or specifically marked as unranked
                // should only apply if this is an equals condition.
                match (rank, ctx.user.treat_as_unranked) {
                    (None, _) | (_, true) => self.compare.is_equals_zero(),
                    (Some(rank), _) => self.compare.evaluate(&rank.tier),
                }
            },
        }
    }
}

impl ServerCondition {
    pub fn evaluate(&self, ctx: &EvaluationContext) -> bool {
        ctx.accounts.iter().any(|x| x.include_region && x.region == self.region)
    }
}
