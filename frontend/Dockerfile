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

# Production stage with nginx
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Keep running as root to avoid PID file issues
# USER nginx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]