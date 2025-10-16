# Docker Nginx Setup Guide - Internal Configuration

This guide shows how to configure nginx directly inside a Docker container without external configuration files, keeping everything self-contained within the Dockerfile.

## Table of Contents

1. [Overview](#overview)
2. [Basic Nginx Docker Setup](#basic-nginx-docker-setup)
3. [Advanced Configuration](#advanced-configuration)
4. [Security Configuration](#security-configuration)
5. [Performance Optimization](#performance-optimization)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Multi-Stage Build Example](#multi-stage-build-example)
8. [Docker Compose Integration](#docker-compose-integration)
9. [Troubleshooting](#troubleshooting)

## Overview

### Benefits of Internal Nginx Configuration

- ✅ **Self-contained**: No external config files to manage
- ✅ **Portable**: Everything needed is in the Dockerfile
- ✅ **Version controlled**: Configuration changes tracked with code
- ✅ **Simplified deployment**: Single image contains everything
- ✅ **No file mounting**: Reduces container complexity

### Methods for Internal Configuration

1. **RUN echo**: Write config directly in Dockerfile
2. **Heredoc syntax**: Multi-line configuration blocks
3. **sed/awk**: Modify existing nginx configs
4. **Environment variable substitution**: Dynamic configuration

## Basic Nginx Docker Setup

### Method 1: Using RUN echo (Simple)

```dockerfile
FROM nginx:alpine

# Create basic nginx configuration
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html index.htm;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Copy your web application files
COPY ./dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Method 2: Using Heredoc (Recommended)

```dockerfile
FROM nginx:alpine

# Create nginx configuration using heredoc
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Copy application files
COPY ./dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Advanced Configuration

### Custom Port Configuration

```dockerfile
FROM nginx:alpine

# Configure nginx for custom port
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 3000;
    listen [::]:3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # API proxy configuration
    location /api/ {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static file serving
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Update main nginx config for custom port
RUN sed -i 's/listen 80;/listen 3000;/' /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Based Configuration

```dockerfile
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Create template configuration
RUN cat > /etc/nginx/conf.d/default.conf.template << 'EOF'
server {
    listen ${NGINX_PORT:-80};
    server_name ${SERVER_NAME:-localhost};
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Dynamic backend proxy
    location /api/ {
        proxy_pass http://${BACKEND_HOST:-backend}:${BACKEND_PORT:-4000};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Create startup script
RUN cat > /docker-entrypoint-custom.sh << 'EOF'
#!/bin/sh
# Substitute environment variables in nginx config
envsubst '${NGINX_PORT} ${SERVER_NAME} ${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
# Start nginx
exec nginx -g "daemon off;"
EOF

RUN chmod +x /docker-entrypoint-custom.sh

COPY ./dist /usr/share/nginx/html

EXPOSE 80
CMD ["/docker-entrypoint-custom.sh"]
```

## Security Configuration

### Enhanced Security Setup

```dockerfile
FROM nginx:alpine

# Create secure nginx configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Hide nginx version
    server_tokens off;

    # Rate limiting (configure in main nginx.conf)
    limit_req_zone $binary_remote_addr zone=web:10m rate=10r/s;
    limit_req zone=web burst=20 nodelay;

    # Security locations
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Main application
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Update main nginx configuration for security
RUN sed -i '/http {/a\    server_tokens off;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    client_max_body_size 10M;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    client_body_timeout 30s;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    client_header_timeout 30s;' /etc/nginx/nginx.conf

COPY ./dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

### High-Performance Configuration

```dockerfile
FROM nginx:alpine

# Create performance-optimized configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;

    # Static assets with aggressive caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        access_log off;

        # Enable compression for these files
        gzip_static on;
    }

    # HTML files with shorter cache
    location ~* \.(html|htm)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Main application
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Update main nginx configuration for performance
RUN sed -i 's/worker_processes auto;/worker_processes auto;\nworker_rlimit_nofile 65535;/' /etc/nginx/nginx.conf && \
    sed -i 's/worker_connections 1024;/worker_connections 1024;\n    use epoll;\n    multi_accept on;/' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    sendfile on;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    tcp_nopush on;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    tcp_nodelay on;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    keepalive_timeout 30;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    keepalive_requests 100;' /etc/nginx/nginx.conf && \
    sed -i '/http {/a\    reset_timedout_connection on;' /etc/nginx/nginx.conf

COPY ./dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## SSL/TLS Setup

### Self-Signed SSL Configuration

```dockerfile
FROM nginx:alpine

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Generate self-signed certificate
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create SSL-enabled configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers for HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

COPY ./dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

## Multi-Stage Build Example

### Complete React App with Nginx

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage with internal nginx config
FROM nginx:alpine AS production

# Install additional tools
RUN apk add --no-cache curl openssl

# Create comprehensive nginx configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
upstream backend {
    server backend:4000;
}

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Logging
    access_log /var/log/nginx/access.log combined;
    error_log /var/log/nginx/error.log warn;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Docker Compose Integration

### docker-compose.yml with Environment Variables

```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NGINX_PORT=3000
      - SERVER_NAME=localhost
      - BACKEND_HOST=backend
      - BACKEND_PORT=4000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build: ./backend
    environment:
      - PORT=4000
    ports:
      - "4000:4000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Configuration Syntax Errors

```bash
# Test nginx configuration in running container
docker exec <container> nginx -t

# Check nginx error logs
docker logs <container>
```

#### 2. Permission Issues

```dockerfile
# Fix file permissions in Dockerfile
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
```

#### 3. Port Binding Issues

```dockerfile
# Ensure EXPOSE matches your listen directive
EXPOSE 3000
# In nginx config: listen 3000;
```

#### 4. Environment Variable Issues

```bash
# Debug environment variables
docker exec <container> env | grep NGINX
```

### Debugging Commands

```bash
# Check nginx process
docker exec <container> ps aux | grep nginx

# View nginx configuration
docker exec <container> nginx -T

# Test configuration
docker exec <container> nginx -t

# Reload configuration
docker exec <container> nginx -s reload

# Check listening ports
docker exec <container> netstat -tlnp
```

### Best Practices

1. **Keep configurations simple**: Avoid overly complex inline configs
2. **Use heredoc syntax**: More readable than multiple echo commands
3. **Test configurations**: Always include `nginx -t` in your build process
4. **Security first**: Include security headers and hide server tokens
5. **Performance optimization**: Enable gzip and proper caching
6. **Health checks**: Include health endpoints for container orchestration
7. **Logging**: Configure appropriate log levels and locations
8. **Environment flexibility**: Use environment variables for dynamic configs

This approach gives you complete control over nginx configuration while keeping everything containerized and portable!
