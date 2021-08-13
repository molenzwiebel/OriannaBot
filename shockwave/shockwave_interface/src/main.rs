use actix_web::error::ErrorNotFound;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use futures::TryFutureExt;
use serde_json::json;
use shockwave_core::database::Database as SWDatabase;
use shockwave_core::discord::Client;
use shockwave_core::riot_api::{Priority, RiotApiInterface};
use shockwave_core::updater::Updater as SWUpdater;
use shockwave_core::worker::Worker as SWWorker;
use tracing::error;

type DB = web::Data<SWDatabase>;
type Updater = web::Data<SWUpdater>;

#[actix_web::post("/api/v1/evaluate/{server_id}/{user_id}")]
async fn evaluate_role(path: web::Path<(i32, i32)>, db: DB) -> actix_web::Result<impl Responder> {
    let (server_id, user_id) = path.into_inner();

    let conditions = db.get_roles_and_conditions_for_server(server_id).await.map_err(ErrorNotFound)?;
    let ctx = db.get_evaluation_context(user_id).await.map_err(ErrorNotFound)?;
    let mut results = vec![];

    for (role, conditions) in conditions {
        results.push(json!({
            "role": role.id,
            "applies": role.evaluate(conditions.iter().collect(), &ctx),
            "conditions": conditions.iter().map(|x| (x.id, x.evaluate(&ctx))).collect::<Vec<_>>()
        }));
    }

    Ok(HttpResponse::Ok().json(results))
}

#[actix_web::post("/api/v1/user/{user_id}/update")]
async fn update_user(path: web::Path<i32>, db: DB, updater: Updater) -> actix_web::Result<impl Responder> {
    let user_id = path.into_inner();

    let ctx = db.get_evaluation_context(user_id).await.map_err(ErrorNotFound)?;

    let result = updater.fetch_all(Priority::UserAction, &ctx).and_then(|_| updater.update_user(user_id)).await;
    if let Err(e) = &result {
        error!("Failed to update user: {:?}", e);
    }

    Ok(HttpResponse::Ok().json(json!({
        "successful": result.is_ok(),
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt::init();
    dotenv::dotenv().ok();

    // Create database.
    let db = SWDatabase::connect(10).await.expect("Could not initialize database.");
    let db_data = web::Data::new(db);

    // Create Riot API structs.
    let riot = RiotApiInterface::new(
        &std::env::var("RIOT_LOL_API_KEY").expect("No LOL API key set."),
        &std::env::var("RIOT_TFT_API_KEY").expect("No TFT API key set."),
    );

    // Create updater instance.
    let updater = web::Data::new(SWUpdater::new(
        db_data.clone().into_inner(),
        Client::new(std::env::var("DISCORD_TOKEN").expect("No Discord token set")),
        riot,
    ));

    // Create worker for update loops.
    let worker = SWWorker::new(db_data.clone().into_inner(), updater.clone().into_inner());

    // Create a web server that runs on the tokio threadpool.
    let webserver = HttpServer::new(move || {
        App::new().app_data(db_data.clone()).app_data(updater.clone()).service(evaluate_role).service(update_user)
    })
    .bind(format!("127.0.0.1:{}", std::env::var("PORT").unwrap_or("8080".to_string())))?
    .run()
    .unwrap_or_else(|e| panic!("Could not start web server: {:?}", e));

    // Run infinitely.
    futures::join!(webserver, worker.run_account_loop(), worker.run_mastery_loop(), worker.run_ranked_loop());

    Ok(())
}
