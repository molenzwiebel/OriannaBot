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

    const newAccount = new LeagueAccountModel();
    newAccount.region = req.body.region;
    newAccount.username = req.body.summonerName;
    newAccount.summonerId = req.body.summonerId;
    newAccount.accountId = req.body.accountId;
    newAccount.owner = user.id;
    await newAccount.save();

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