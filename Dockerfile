# syntax=docker/dockerfile:1

# ---- Build stage: install deps and produce the static bundle in dist/ ----
FROM node:22-alpine AS build
WORKDIR /app

# Install all deps (dev deps are needed for the Vite build).
COPY package.json package-lock.json ./
RUN npm ci

# Build the frontend into dist/. .git isn't copied, so the hash shown on the
# About page comes from GIT_HASH (falls back to "unknown").
ARG GIT_HASH=unknown
# .env is excluded from the build context; Vite build-time overrides come in as args.
ARG VITE_GEMINI_MODEL
ARG VITE_DEEPSEEK_MODEL
COPY . .
RUN npm run build

# ---- Runtime stage: run the Express/WebSocket server via tsx ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# tsx (a devDependency) runs server.ts directly, so a full install is needed.
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Server entrypoint + the built assets it serves from dist/.
COPY server.ts ./
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["npm", "start"]
