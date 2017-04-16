import Based, { Basie, field, children } from "basie";

export interface UserPoints {
    [champId: number]: number | undefined
}

export abstract class User extends Basie {
    @field
    snowflake: string;

    @field
    configCode: string;

    @field
    username: string;

    @field
    lastUpdateTimestamp: number;

    @children(model => LeagueAccountModel)
    accounts: LeagueAccount[];

    @field
    latestPointsJson: string;

    @field
    optedOutOfReminding: boolean;

    async addAccount(region: string, data: riot.Summoner) {
        const acc = new LeagueAccountModel();
        acc.owner = this.id;
        acc.username = data.name;
        acc.summonerId = data.id;
        acc.accountId = data.accountId;
        acc.region = region;
        await acc.save();
    }

    get lastUpdate(): Date {
        return new Date(this.lastUpdateTimestamp);
    }

    set lastUpdate(value: Date) {
        this.lastUpdateTimestamp = value.getTime();
    }

    get latestPoints(): UserPoints {
        return JSON.parse(this.latestPointsJson);
    }

    set latestPoints(value: UserPoints) {
        this.latestPointsJson = JSON.stringify(value);
    }
}
export const UserModel = Based(User);

export abstract class LeagueAccount extends Basie {
    @field("user_id")
    owner: number;

    @field
    region: string;

    @field
    summonerId: number;

    @field
    accountId: number;

    @field
    username: string;
}
export const LeagueAccountModel = Based(LeagueAccount);

export abstract class DiscordServer extends Basie {
    @field
    snowflake: string;

    @field
    configCode: string;

    @field
    name: string;

    @field
    championId: number;

    @field
    announcePromotions: boolean;

    @field
    regionRoles: boolean;

    @field("existingRoles")
    existingRolesJson: string;

    @field
    announceChannelSnowflake: string; // "" if default channel or announcePromotions = false

    @children(model => RoleModel)
    roles: Role[];

    @field
    setupCompleted: boolean;

    async addRole(name: string, range: string) {
        const role = new RoleModel();
        role.snowflake = "";
        role.name = name;
        role.range = range;
        role.owner = this.id;
        await role.save();
    }

    set existingRoles(val: string[]) {
        this.existingRolesJson = JSON.stringify(val);
    }
}
export const DiscordServerModel = Based(DiscordServer);

export abstract class Role extends Basie {
    @field
    snowflake: string;

    @field("discordserver_id")
    owner: number;

    @field
    name: string;

    @field
    range: string;
}
export const RoleModel = Based(Role);