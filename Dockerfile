# Build Stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma engine on Alpine
RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

# Copy package specifications
COPY package*.json ./
COPY prisma ./prisma/

# Configure npm for resilient downloading
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy source files
COPY . .

# Generate Prisma Client and build server + web bundles
RUN npm run build

# Prune devDependencies (NO second internet download required!)
RUN npm prune --omit=dev

# Production Runner Stage
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma runtime on Alpine
RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package definitions
COPY package*.json ./
COPY prisma ./prisma/

# Copy pre-installed & pruned production node_modules from builder stage (Zero network calls!)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start"]
