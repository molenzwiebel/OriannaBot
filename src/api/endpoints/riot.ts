import express = require("express");
import APIWebServer from "../server";

// GET '/api/lookup/:region/:name'
export async function summonerLookup(this: APIWebServer, req: express.Request, res: express.Response) {
    const results = await this.riot.getSummonerByName(req.params.region, req.params.name);
    res.send(results || "null");
}

// GET '/api/verify/:region/:id/:expected'
export async function summonerIconVerify(this: APIWebServer, req: express.Request, res: express.Response) {
    const data = await this.riot.getSummonerById(req.params.region, req.params.id);
    res.send(data && data.profileIconId === +req.params.expected);
}