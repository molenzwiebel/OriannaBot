#![feature(hash_extract_if)]
#![feature(extract_if)]

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
