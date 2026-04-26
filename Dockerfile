# Bundle frontend
FROM node:12-stretch AS frontend-builder

WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

# Build actual frontend
COPY frontend/tsconfig.json frontend/webpack.config.js ./
COPY frontend/src ./src
RUN yarn bundle

# Backend runner
FROM node:12-stretch

WORKDIR /app/backend

# Install ffmpeg
RUN cd /tmp && \
    wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    tar -xf ffmpeg-release-amd64-static.tar.xz --strip-components=1 && \
    mv ffmpeg /usr/local/bin/ && \
    mv ffprobe /usr/local/bin/ && \
    rm ffmpeg-release-amd64-static.tar.xz

# Set up translation
COPY trans /app/trans

# Install dependencies
COPY backend/package.json backend/yarn.lock ./
RUN yarn install --frozen-lockfile

# Build backend
COPY backend/tsconfig.json backend/knexfile.js ./
COPY backend/src ./src
COPY backend/assets ./assets
COPY backend/migrations ./migrations
RUN yarn bundle

# Set up frontend
COPY --from=frontend-builder /app/dist ../frontend/dist
ENV ORIANNA_FRONTEND_PATH=/app/frontend/dist

ENTRYPOINT ["node", "/app/backend/dist/index.js"]