# Dissonance

This subfolder contains a Rust project that implements a gateway caching and proxy layer for Orianna. It is used to receive events from Discord, update the cache and forward events to the command handling layer while being very performant.

In order to run, copy `.env.template` to `.env` and add your own values. You will also need a Postgres instance, a Redis instance and a RabbitMQ instance. The supplied `docker-compose.yml` will set all of these up for you. Then, run the application with `cargo run`.