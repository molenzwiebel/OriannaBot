# Shockwave

This subfolder contains a Rust project that implements the updater engine for Orianna. It consists of the main updater engine (`shockwave_core`), and a web-server component that the bot uses for interactive update requests (such as through the update command). These two components are separate mainly to facilitate faster compilation and checking speeds when working on the core component (as this avoids having to check the entire actix crate and dependencies).

In order to run, copy .env.template to .env and add your own values. You will also need a Postgres instance and a Discord API proxy. The supplied `docker-compose.yml` will set all of these up for you. Then, run the application with `cargo run`.