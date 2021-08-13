//! Manages interaction with the Orianna frontend for activities
//! that require a more complex interaction/different data than we
//! support in this updater-cental library. Note that shockwave is
//! able to run independently, i.e. these methods are completely
//! optional.

use std::time::Duration;

use reqwest::header;
use serde_json::json;
use tracing::warn;

lazy_static::lazy_static! {
    static ref CLIENT: reqwest::Client = {
        let mut headers = header::HeaderMap::new();
        let mut auth_value = header::HeaderValue::from_str(
            &std::env::var("ORIANNA_WEB_TOKEN").unwrap()
        ).unwrap();
        auth_value.set_sensitive(true);
        headers.insert(header::AUTHORIZATION, auth_value);

        reqwest::ClientBuilder::new()
            .user_agent("Shockwave")
            .default_headers(headers)
            .timeout(Duration::from_secs(5))
            .build()
            .expect("Couldn't create reqwest client")
    };
}

/// Returns whether or not interaction with the Orianna instance
/// is supported/configured.
pub fn supported() -> bool {
    std::env::var("ORIANNA_WEB_ADDRESS").is_ok() && std::env::var("ORIANNA_WEB_TOKEN").is_ok()
}

/// Helper to get a full URL for the given slash section.
#[inline]
fn format_url(part: &'static str) -> String {
    format!("{}{}", std::env::var("ORIANNA_WEB_ADDRESS").unwrap(), part)
}

/// Create an announcement that the given user just gained the
/// role with the given ID. This should only be invoked if the
/// role has promotions turned on, although this can possibly
/// be verified by the Orianna component as well.
#[tracing::instrument]
pub async fn announce_promotion(user_id: i32, role_id: i32) {
    if !supported() {
        return;
    }

    let response = CLIENT
        .post(format_url("/api/v1/shockwave/promote"))
        .json(&json!({
            "user_id": user_id,
            "role_id": role_id
        }))
        .send()
        .await;

    // If this failed, we should log an error since the user has
    // specified arguments, but the arguments were invalid.
    match response {
        Ok(resp) if !resp.status().is_success() => {
            warn!("Promotion request to Orianna returned non-200 status: {}", resp.status())
        },
        Err(e) => warn!("Promotion request to Orianna failed: {}", e),
        _ => {},
    }
}

/// Notifies the user with the given ID that the account with the given
/// region and username no longer seems to exist. It is assumed that the
/// caller will have already removed the account from the database.
#[tracing::instrument(skip(region, username))]
pub async fn message_transfer(user_id: i32, region: &str, username: &str) {
    if !supported() {
        return;
    }

    let response = CLIENT
        .post(format_url("/api/v1/shockwave/transfer"))
        .json(&json!({
            "user_id": user_id,
            "region": region,
            "username": username
        }))
        .send()
        .await;

    // If this failed, we should log an error since the user has
    // specified arguments, but the arguments were invalid.
    match response {
        Ok(resp) if !resp.status().is_success() => {
            warn!("Transfer message request to Orianna returned non-200 status: {}", resp.status())
        },
        Err(e) => warn!("Transfer message request to Orianna failed: {}", e),
        _ => {},
    }
}
