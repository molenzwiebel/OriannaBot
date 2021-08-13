use std::{
    sync::{
        atomic::{AtomicI64, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use futures::{Future, Stream, StreamExt, TryFutureExt};
use tracing::info;

use crate::{database::Database, evaluate::EvaluationContext, riot_api::Priority, updater::Updater};

#[derive(Copy, Clone)]
struct WorkerLoopConfiguration {
    query_batch_size: u32,
    concurrent_updates: u32,
    name: &'static str,
}

pub struct Worker {
    updater: Arc<Updater>,
    database: Arc<Database>,
}

static MASTERY_WORKER_CONFIG: WorkerLoopConfiguration =
    WorkerLoopConfiguration { query_batch_size: 100, concurrent_updates: 200, name: "mastery" };

static RANKED_WORKER_CONFIG: WorkerLoopConfiguration =
    WorkerLoopConfiguration { query_batch_size: 100, concurrent_updates: 15, name: "ranks" };

static ACCOUNT_WORKER_CONFIG: WorkerLoopConfiguration =
    WorkerLoopConfiguration { query_batch_size: 100, concurrent_updates: 15, name: "accounts" };

impl Worker {
    /// Create a new update worker that uses the given updater.
    pub fn new(database: Arc<Database>, updater: Arc<Updater>) -> Worker {
        Worker { database, updater }
    }

    /// Start a new worker updater loop that is responsible for updating
    /// user mastery according to the configuration in `MASTERY_WORKER_CONFIG`.
    pub async fn run_mastery_loop(&self) {
        self.run_concurrently_on_streams(
            &|ctx| async move {
                let _ = self.updater
                    .fetch_mastery_scores(Priority::Updater, &ctx)
                    .and_then(|_| self.updater.update_user(ctx.user.id))
                    .await;
            },
            MASTERY_WORKER_CONFIG,
        )
        .await;
    }

    /// Start a new worker updater loop that is responsible for updating
    /// user ranked tiers according to the configuration in `RANKED_WORKER_CONFIG`.
    pub async fn run_ranked_loop(&self) {
        self.run_concurrently_on_streams(
            &|ctx| async move {
                let _ = self.updater
                    .fetch_user_ranks(Priority::Updater, &ctx)
                    .and_then(|_| self.updater.update_user(ctx.user.id))
                    .await;
            },
            RANKED_WORKER_CONFIG,
        )
        .await;
    }

    /// Start a new worker updater loop that is responsible for updating
    /// user accounts according to the configuration in `ACCOUNT_WORKER_CONFIG`.
    pub async fn run_account_loop(&self) {
        self.run_concurrently_on_streams(
            &|ctx| async move {
                let _ = self.updater
                    .fetch_user_accounts(Priority::Updater, &ctx)
                    .and_then(|_| self.updater.update_user(ctx.user.id))
                    .await;
            },
            ACCOUNT_WORKER_CONFIG,
        )
        .await;
    }

    /// Given the specified function, runs the function concurrently on an infinite
    /// stream of users, configured by the given configuration. Metrics will be printed
    /// periodically.
    async fn run_concurrently_on_streams<'a, R>(
        &'a self,
        fun: &'a impl Fn(EvaluationContext) -> R,
        config: WorkerLoopConfiguration,
    ) where
        R: Future<Output = ()>,
    {
        let stream = self.get_user_context_stream(config.query_batch_size);

        let amount = Arc::new(AtomicI64::new(0));
        let amount_clone = amount.clone();

        // Timing loop, keeps track of number of users processed.
        tokio::spawn(async move {
            let start = Instant::now();

            loop {
                tokio::time::sleep(Duration::from_secs(10)).await;

                let amnt = amount_clone.load(Ordering::SeqCst);
                let elapsed_time = start.elapsed().as_secs_f64();

                info!("Updated {} for {} users ({:.2} users/s)", config.name, amnt, (amnt as f64 / elapsed_time));
            }
        });

        // Actual concurrent invocation. Since the stream is infinite,
        // this will never resolve.
        stream
            .for_each_concurrent(config.concurrent_updates as usize, move |ctx| {
                let amnt_clone = amount.clone();

                async move {
                    fun(ctx).await;

                    amnt_clone.fetch_add(1, Ordering::SeqCst);
                }
            })
            .await
    }

    /// Create a new stream of evaluation contexts that endlessly
    /// returns evaluation contexts of users with at least one account.
    fn get_user_context_stream(&self, batch_size: u32) -> impl Stream<Item = EvaluationContext> + '_ {
        futures::stream::unfold(0u32, move |mut offset| async move {
            // Keep attempting to find users.
            loop {
                if let Ok(contexts) = self
                    .database
                    .find_users(batch_size, offset)
                    .and_then(|ids| self.database.get_batch_evaluation_context(ids))
                    .await
                {
                    // If we received less than `batch_size` contexts, it means
                    // that we reached the end and need to loop around to the start.
                    if contexts.len() < batch_size as usize {
                        offset = 0;
                    } else {
                        offset += batch_size;
                    }

                    return Some((futures::stream::iter(contexts), offset));
                }

                // Wait for a second and then retry.
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        })
        .flatten()
    }
}
