# Multi-stage Dockerfile for React frontend
# Build stage
FROM node:18-bullseye-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files from frontend directory
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build the application
RUN npm run build

# Production stage with Node.js serve
FROM node:18-bullseye-slim AS production

# Install serve and security updates
RUN apt-get update && apt-get upgrade -y && \
    npm install -g serve && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /app/dist

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start serve to serve the built React app
CMD ["serve", "-s", "dist", "-l", "3000"]