import express = require("express");
import { UserAuthKey } from "../database";

export default function register(app: express.Application) {
    app.get("/login/:key", async (req, res) => {
        const entry = await UserAuthKey.query().where("key", req.params.key).eager("user").first();
        if (!entry) return res.redirect("/login-fail");

        // Keys expire after a day.
        if (Date.now() - new Date(entry.created_at).getTime() > 24 * 60 * 60 * 1000) {
            await entry.$query().delete();
            return res.redirect("/login-fail");
        }

        // We used the key, delete it.
        await entry.$query().delete();

        res.cookie("token", entry.user.token);
        return res.redirect("/me");
    });
}