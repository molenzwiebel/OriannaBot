
export type RangeCondition<T> = ({
    compare_type: "at_least";
    value: number;
} & T) | ({
    compare_type: "at_most";
    value: number;
} & T) | ({
    compare_type: "between";
    min: number;
    max: number;
} & T);

export function evaluateRangeCondition(cnd: RangeCondition<{}>, value: number): boolean {
    if (cnd.compare_type === "at_least") return value > cnd.value;
    if (cnd.compare_type === "at_most") return value < cnd.value;
    return value >= cnd.min && value <= cnd.max;
}

export interface MasteryLevelCondition {
    type: "mastery_level";
    metadata: {
        level: number;
        champion: number;
    };
}

export interface MasteryScoreCondition {
    type: "mastery_score";
    metadata: RangeCondition<{
        champion: number
    }>;
}

export interface TotalMasteryScoreCondition {
    type: "total_mastery_score";
    metadata: RangeCondition<{}>;
}

export interface RankedTierCondition {
    type: "ranked_tier";
    metadata: {
        compare_type: "higher" | "lower" | "equal";
        tier: number;
        queue: string;
    };
}

export interface ChampionPlayCountCondition {
    type: "champion_play_count";
    metadata: {
        count: number;
        champion: number;
    };
}

export interface ServerCondition {
    type: "server";
    metadata: {
        region: string;
    };
}

export type TypedRoleCondition =
    MasteryLevelCondition
    | MasteryScoreCondition
    | TotalMasteryScoreCondition
    | RankedTierCondition
    | ChampionPlayCountCondition
    | ServerCondition;