# Ubuntu Nginx Setup Guide for E-commerce Application

This guide will help you configure Nginx directly on your Ubuntu machine to serve the e-commerce application with proper SSL, security headers, and performance optimizations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing Nginx](#installing-nginx)
3. [SSL Certificate Setup](#ssl-certificate-setup)
4. [Nginx Configuration](#nginx-configuration)
5. [Domain Setup](#domain-setup)
6. [Security Configuration](#security-configuration)
7. [Performance Optimization](#performance-optimization)
8. [Maintenance Commands](#maintenance-commands)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Ubuntu 20.04 LTS or newer
- Root or sudo access
- Domain name (optional, can use localhost for testing)
- Basic understanding of command line

## Installing Nginx

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Nginx

```bash
sudo apt install nginx -y
```

### 3. Start and Enable Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Check Nginx Status

```bash
sudo systemctl status nginx
```

### 5. Configure Firewall (if UFW is enabled)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable
```

## SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended for Production)

#### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### Obtain SSL Certificate

```bash
# Replace shop.local with your actual domain
sudo certbot --nginx -d shop.local -d www.shop.local
```

### Option 2: Self-Signed Certificate (Development Only)

#### Create SSL Directory

```bash
sudo mkdir -p /etc/ssl/private
sudo chmod 700 /etc/ssl/private
```

#### Generate Self-Signed Certificate

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/shop.local.key \
    -out /etc/ssl/private/shop.local.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=shop.local"
```

#### Set Proper Permissions

```bash
sudo chmod 600 /etc/ssl/private/shop.local.key
sudo chmod 644 /etc/ssl/private/shop.local.crt
```

## Nginx Configuration

### 1. Create Application Directory

```bash
sudo mkdir -p /var/www/ecommerce
sudo chown -R $USER:$USER /var/www/ecommerce
sudo chmod -R 755 /var/www/ecommerce
```

### 2. Create Nginx Virtual Host Configuration

```bash
sudo nano /etc/nginx/sites-available/ecommerce
```

### 3. Add Configuration Content

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name shop.local www.shop.local localhost;
    return 301 https://$server_name$request_uri;
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name shop.local www.shop.local localhost;

    # Document root - where your built React app will be served from
    root /var/www/ecommerce;
    index index.html index.htm;

    # SSL Configuration
    ssl_certificate /etc/ssl/private/shop.local.crt;
    ssl_certificate_key /etc/ssl/private/shop.local.key;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP stapling (comment out for self-signed certificates)
    # ssl_stapling on;
    # ssl_stapling_verify on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private no_last_modified no_etag auth;
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

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets with long-term caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        # Add CORS headers for fonts and assets
        add_header Access-Control-Allow-Origin "*";
    }

    # API proxy to your backend service
    location /api/ {
        # Update this to your backend server address
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Images proxy to backend
    location /images/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Caching for images
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files and directories
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Deny access to backup and config files
    location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Security: Limit file upload size (adjust as needed)
    client_max_body_size 10M;

    # Access and Error Logs
    access_log /var/log/nginx/ecommerce_access.log;
    error_log /var/log/nginx/ecommerce_error.log;
}
```

### 4. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
```

### 5. Remove Default Nginx Site (Optional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 6. Test Nginx Configuration

```bash
sudo nginx -t
```

### 7. Reload Nginx

```bash
sudo systemctl reload nginx
```

## Domain Setup

### Local Development Setup

#### 1. Edit Hosts File

```bash
sudo nano /etc/hosts
```

#### 2. Add Domain Entries

```
127.0.0.1 shop.local
127.0.0.1 www.shop.local
```

### Production Domain Setup

For production, ensure your domain's DNS A record points to your server's IP address.

## Security Configuration

### 1. Enable Fail2Ban (Optional but Recommended)

```bash
sudo apt install fail2ban -y
```

#### Create Nginx Jail Configuration

```bash
sudo nano /etc/fail2ban/jail.local
```

#### Add Configuration

```ini
[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
```

#### Start Fail2Ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Configure ModSecurity (Advanced)

```bash
sudo apt install libmodsecurity3 -y
sudo apt install modsecurity-crs -y
```

## Performance Optimization

### 1. Optimize Nginx Configuration

```bash
sudo nano /etc/nginx/nginx.conf
```

#### Key Performance Settings

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;
server_tokens off;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1000;
```

### 2. Enable HTTP/2 (Already included in config above)

HTTP/2 is enabled in the server block with `listen 443 ssl http2;`

### 3. Set up Rate Limiting

Add to the http block in `/etc/nginx/nginx.conf`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Then in your server block:

```nginx
# Apply rate limiting to API endpoints
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... rest of proxy configuration
}

# Stricter rate limiting for login
location /api/auth/login {
    limit_req zone=login burst=5 nodelay;
    # ... rest of proxy configuration
}
```

## Deployment Process

### 1. Build Your React Application

```bash
# In your local development environment
npm run build
```

### 2. Upload Built Files

```bash
# Copy the dist folder contents to your server
scp -r ./frontend/dist/* user@your-server:/var/www/ecommerce/
```

### 3. Set Proper Permissions

```bash
sudo chown -R www-data:www-data /var/www/ecommerce
sudo chmod -R 755 /var/www/ecommerce
```

### 4. Reload Nginx

```bash
sudo systemctl reload nginx
```

## Maintenance Commands

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Reload Configuration (without downtime)

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### View Access Logs

```bash
sudo tail -f /var/log/nginx/ecommerce_access.log
```

### View Error Logs

```bash
sudo tail -f /var/log/nginx/ecommerce_error.log
```

### Check SSL Certificate Expiry

```bash
sudo certbot certificates
```

### Renew SSL Certificates

```bash
sudo certbot renew --dry-run
sudo certbot renew
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "502 Bad Gateway" Error

- Check if your backend service is running on port 4000
- Verify backend is accessible: `curl http://localhost:4000/api/health`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/ecommerce_error.log`

#### 2. SSL Certificate Issues

- For Let's Encrypt: Ensure domain points to your server
- For self-signed: Check certificate paths in Nginx config
- Test SSL: `sudo nginx -t`

#### 3. Permission Denied Errors

```bash
sudo chown -R www-data:www-data /var/www/ecommerce
sudo chmod -R 755 /var/www/ecommerce
```

#### 4. Nginx Won't Start

```bash
sudo nginx -t  # Check configuration syntax
sudo systemctl status nginx  # Check service status
sudo journalctl -u nginx  # Check system logs
```

#### 5. High CPU Usage

- Check for DDoS attacks in access logs
- Implement rate limiting
- Optimize gzip settings
- Consider adding a CDN

### Performance Monitoring

#### Monitor Nginx Connections

```bash
# Install nginx-extras for status module
sudo apt install nginx-extras -y
```

Add to your Nginx configuration:

```nginx
location /nginx_status {
    stub_status on;
    allow 127.0.0.1;
    deny all;
    access_log off;
}
```

#### Monitor with htop

```bash
sudo apt install htop -y
htop
```

## Security Best Practices

1. **Keep Nginx Updated**: `sudo apt update && sudo apt upgrade nginx`
2. **Regular Security Audits**: Use tools like `nmap` and `nikto`
3. **Monitor Logs**: Set up log monitoring and alerting
4. **Backup Configuration**: Keep backups of your Nginx configs
5. **Use Strong SSL Ciphers**: Regularly update SSL configuration
6. **Hide Nginx Version**: `server_tokens off;` (already included)
7. **Implement WAF**: Consider CloudFlare or similar services

## Additional Resources

- [Official Nginx Documentation](https://nginx.org/en/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Security Guide](https://github.com/h5bp/server-configs-nginx)

---

## Quick Start Commands Summary

```bash
# 1. Install Nginx
sudo apt update && sudo apt install nginx -y

# 2. Create site configuration
sudo nano /etc/nginx/sites-available/ecommerce

# 3. Enable site
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/

# 4. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 5. Setup SSL (choose one method from the guide above)

# 6. Deploy your application to /var/www/ecommerce

# 7. Set permissions
sudo chown -R www-data:www-data /var/www/ecommerce
```

This guide provides a production-ready Nginx configuration with security, performance, and maintainability in mind. Adjust the configuration based on your specific requirements and environment.
