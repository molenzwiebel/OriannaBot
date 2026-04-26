FROM rust:1.95-alpine AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY .sqlx .sqlx
COPY src ./src

RUN cargo build --release

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/target/release/dissonance /app/dissonance

ENTRYPOINT ["/app/dissonance"]