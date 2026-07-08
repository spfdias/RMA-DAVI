FROM node:20-alpine

WORKDIR /app

# Install server dependencies (all — devDeps needed for build)
COPY server/package*.json ./server/
RUN cd server && npm ci

# Build client
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Copy server source and compile
COPY server/tsconfig.json ./server/
COPY server/src ./server/src
RUN cd server && npx tsc

# Remove dev dependencies for smaller image
RUN cd server && npm prune --omit=dev

# Create persistent directories
RUN mkdir -p /app/server/data/uploads

EXPOSE 3001

CMD ["node", "server/dist/index.js"]