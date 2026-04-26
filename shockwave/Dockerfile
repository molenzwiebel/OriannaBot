FROM rust:1.95-alpine AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY shockwave_core ./shockwave_core
COPY shockwave_interface ./shockwave_interface

RUN cargo build --release

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/target/release/shockwave_interface /app/shockwave_interface

ENTRYPOINT ["/app/shockwave_interface"]