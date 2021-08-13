#![feature(hash_drain_filter)]
#![feature(drain_filter)]

pub mod database;
pub mod riot_api;
pub mod updater;
pub mod worker;

pub use twilight_http as discord;

mod db_model;
mod evaluate;
mod orianna;
mod role_model;
mod util;
