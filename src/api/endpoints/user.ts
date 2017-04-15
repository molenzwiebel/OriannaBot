import express = require("express");
import { UserModel, LeagueAccountModel } from "../../database";

// GET '/api/user/:code'
export async function userGet(req: express.Request, res: express.Response) {
    const user = await UserModel.findBy({ configCode: req.params.code });
    res.status(user ? 200 : 404).send(user);
}

// PUT '/api/user/:code/account'
export async function userPut(req: express.Request, res: express.Response) {
    const user = await UserModel.findBy({ configCode: req.params.code });
    if (!user) throw new Error("User not found.");

    await user.addAccount(req.body.region, {
        id: req.body.summonerId,
        name: req.body.summonerName,
        accountId: req.body.accountId
    });

    res.send();
}

// DELETE '/api/user/:code'
export async function userDelete(req: express.Request, res: express.Response) {
    const user = await UserModel.findBy({ configCode: req.params.code });
    if (!user) throw new Error("User not found.");

    const role = await LeagueAccountModel.findBy({ owner: user.id, region: req.body.region, summonerId: req.body.summonerId, accountId: req.body.accountId });
    if (!role) throw new Error("Role not found.");

    await role.destroy();
    res.send();
}