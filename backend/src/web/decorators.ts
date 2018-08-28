import express = require("express");
import debug = require("debug");
import * as db from "../database";
import elastic from "../elastic";

const swallowErrorLog = debug("orianna:web:error");

export type ExpressRouteHandler = (req: express.Request, res: express.Response) => any;

declare module "express" {
    interface Request {
        user: db.User;
    }
}

// There seems to be a typescript miscompilation bug that prevents it from emitting the database
// import if we only reference it inside an async function expression. Useless reference here:
db.User;

/**
 * Simple decorator that requires that the user has a valid cookie specifying a token.
 * If there is no cookie, 401 Unauthorized is returned. If the token does not resolve to
 * a valid user, 403 Forbidden is returned.
 */
export function requireAuth(fn: ExpressRouteHandler) {
    return async (req: express.Request, res: express.Response) => {
        if (!req.cookies.token) return res.status(401).json({
            error: "Unauthenticated",
            code: 401
        });

        const user = await db.User.query().where("token", req.cookies.token).first();
        if (!user) return res.status(403).json({
            error: "Authentication Failed",
            code: 403
        });

        req.user = user;

        return fn(req, res);
    };
}

/**
 * Simple decorator that ensures that erroring function handlers will
 * still always return a value.
 * @param {ExpressRouteHandler} fn
 */
export function swallowErrors(fn: ExpressRouteHandler) {
    return async (req: express.Request, res: express.Response) => {
        try {
            await Promise.resolve(fn(req, res));
        } catch (e) {
            swallowErrorLog("Error handling %s %s: %s", req.method, req.url, e.message);
            swallowErrorLog("%o", e);
            elastic.reportError(e, "web request: " + req.url);

            try {
                res.status(500).send();
            } catch (ignored) { /* The response was already sent. */ }
        }
    };
}