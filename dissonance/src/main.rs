#[macro_use]
extern crate lazy_static;

use std::error::Error;

use tracing::info;

use crate::worker::Worker;

mod cache;
mod database;
mod forwarder;
mod worker;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    tracing_subscriber::fmt::init();
    dotenv::dotenv().ok();

    info!("Starting dissonance...");

    let worker = Worker::new().await?;

    info!("Worker successfully initialized.");

    worker.run().await;

    Ok(())
}
