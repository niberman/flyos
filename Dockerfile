# --------------------------------------------------------------------------
# Multi-stage Dockerfile for the FlyOS NestJS Application
# --------------------------------------------------------------------------
# Stage 1 (build): Installs all dependencies, generates the Prisma client,
#   and compiles TypeScript to JavaScript.
# Stage 2 (production): Copies only the compiled output and production
#   dependencies, resulting in a smaller, more secure image.
# --------------------------------------------------------------------------

# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 3000

# Run database migrations then start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
