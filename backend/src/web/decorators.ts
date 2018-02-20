import express = require("express");
import debug = require("debug");
import { User } from "../database";

const swallowErrorLog = debug("orianna:web:error");

export type ExpressRouteHandler = (req: express.Request, res: express.Response) => any;

declare module "express" {
    interface Request {
        user: User;
    }
}

/**
 * Simple decorator that requires that the user has a valid cookie specifying a token.
 * If there is no cookie, 401 Unauthorized is returned. If the token does not resolve to
 * a valid user, 403 Forbidden is returned.
 */
function requireAuth(fn: ExpressRouteHandler) {
    return async (req: express.Request, res: express.Response) => {
        if (!req.cookies.token) return res.status(401).send();

        const user = await User.query().where("token", req.cookies.token).first();
        if (!user) return res.status(403).send();

        req.user = user;

        return fn(req, res);
    };
}

/**
 * Simple decorator that ensures that erroring function handlers will
 * still always return a value.
 * @param {ExpressRouteHandler} fn
 */
function swallowErrors(fn: ExpressRouteHandler) {
    return async (req: express.Request, res: express.Response) => {
        try {
            await Promise.resolve(fn(req, res));
        } catch (e) {
            swallowErrorLog("Error handling %s %s: %s", req.method, req.url, e.message);
            swallowErrorLog("%o", e);
            try {
                res.status(500).send();
            } catch (ignored) { /* The response was already sent. */ }
        }
    };
}