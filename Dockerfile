FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `src/lib/env.ts` validates the environment the moment it is imported, and
# `next build` imports every route to collect its page data — so the build needs
# values for the server-only variables even though it never connects to
# anything. These placeholders exist only inside this layer; the runtime image
# reads the real values from the container environment, and a missing one there
# still fails fast at startup.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
    SMTP_HOST=build.invalid \
    SMTP_PORT=587 \
    SMTP_FROM=build@build.invalid \
    STORAGE_ENDPOINT=https://build.invalid \
    STORAGE_BUCKET=build \
    STORAGE_ACCESS_KEY_ID=build \
    STORAGE_SECRET_ACCESS_KEY=build \
    STORAGE_REGION=build

# This one is different: NEXT_PUBLIC_* is inlined into the bundle at build time,
# so it cannot be deferred to runtime. It ends up in canonical URLs, the sitemap
# and robots.txt — pass the real public origin when building.
#   docker build --build-arg NEXT_PUBLIC_SITE_URL=https://staging.example.ch .
ARG NEXT_PUBLIC_SITE_URL=https://fiduvia.ch
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
# Run as the image's unprivileged user rather than root.
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
