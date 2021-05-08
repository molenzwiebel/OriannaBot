#[macro_use]
extern crate lazy_static;

use std::error::Error;

use crate::worker::Worker;

mod cache;
mod database;
mod forwarder;
mod worker;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    tracing_subscriber::fmt::init();
    dotenv::dotenv().ok();

    let worker = Worker::new().await?;

    worker.run().await;

    Ok(())
}
