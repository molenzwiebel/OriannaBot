import express = require("express");
import { ScoreDeltaModel, UserModel } from "../../database";
import { Database } from "basie";

// GET '/api/stats/:id/list'
export async function getStatChampions(req: express.Request, res: express.Response) {
    const user = await UserModel.find(+req.params.id);
    if (!user) return res.status(404).send();

    const uniq = await Database.all<{ championId: number }>(`SELECT DISTINCT championId FROM scoredelta WHERE user=?;`, [req.params.id]);
    res.send({
        username: user.username,
        champions: uniq.map(x => x.championId)
    });
}

// GET '/api/stats/:id/:champId'
export async function getStats(req: express.Request, res: express.Response) {
    const deltas = await ScoreDeltaModel.where({ user: req.params.id, championId: req.params.champId });
    res.send(deltas.map(x => ({
        timestamp: new Date(x.timestamp).toISOString(),
        newValue: x.newValue,
        delta: x.delta
    })));
}