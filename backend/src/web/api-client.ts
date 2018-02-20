import express = require("express");
import * as eris from "eris";

export default class WebAPIClient {
    constructor(private bot: eris.Client, private app: express.Application) {

    }
}