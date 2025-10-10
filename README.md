# E-Commerce Demo Application for Security Testing

⚠️ **SECURITY NOTICE**: This application contains intentional vulnerabilities for educational and authorized security testing purposes only. **DO NOT** deploy this application in production environments. Only test on systems you own or have explicit permission to test.

## Overview

This is a fully functional e-commerce application built with modern web technologies, designed specifically for security testing and penetration testing education. The application includes a vulnerability toggle (`VULN_MODE`) that enables/disables intentional security flaws.

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (for frontend)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- 8GB+ RAM available for containers
- Ports 3000, 4000, and 5432 available

### 1. Clone and Setup

```bash
git clone <repository-url>
cd e-commerce
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file:

```bash
# For secure operation (recommended)
VULN_MODE=false

# For security testing (authorized testing only)
VULN_MODE=true
```

### 3. Start Application

```bash
docker-compose up --build
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Database**: localhost:5432 (PostgreSQL)

## Application Features

### Core E-commerce Functionality

1. **Product Catalog**

   - Browse products with pagination
   - Search functionality
   - Product detail views
   - Responsive design

2. **Shopping Cart**

   - Add/remove items
   - Quantity management
   - Persistent cart (localStorage)

3. **Checkout Process**

   - Billing information
   - Order processing
   - Payment simulation
   - Order confirmation

4. **Admin Panel**
   - Product creation
   - Image upload (base64)
   - Admin interface

### Image Upload System

The application implements image upload **without external libraries** as requested:

- Uses `FileReader` API on frontend to convert images to base64
- Backend receives base64 data via JSON
- Uses Node.js core modules (`fs`, `Buffer`) to save images
- Images stored in `./data/images` directory
- Static serving via Express

## API Endpoints

### Product Management

```bash
# List products (with pagination and search)
GET /api/products?page=1&limit=10&search=term

# Get product details
GET /api/products/:id

# Create product (admin)
POST /api/products
Content-Type: application/json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### File Upload

```bash
# Upload image
POST /api/upload-image
Content-Type: application/json
{
  "filename": "image.jpg",
  "dataBase64": "data:image/jpeg;base64,..."
}
```

### Checkout

```bash
# Process checkout
POST /api/checkout
Content-Type: application/json
{
  "cart": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 99.99
    }
  ],
  "billing": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St"
  }
}
```

### Static Assets

```bash
# Serve uploaded images
GET /images/:filename

# Health check
GET /healthz
```

## Security Testing Guide

### Vulnerability Mode (`VULN_MODE=true`)

When enabled, the application intentionally introduces security vulnerabilities for testing:

#### 1. SQL Injection (High Risk)

- **Location**: `backend/src/routes/products.ts:27-32`
- **Vulnerability**: Search endpoint uses string concatenation instead of parameterized queries
- **Test**: `/api/products?search=' OR 1=1 --`
- **Remediation**: Use parameterized queries with `$1`, `$2` placeholders

#### 2. Cross-Site Scripting (XSS) (High Risk)

- **Location**: `frontend/src/pages/HomePage.tsx:127-130`
- **Vulnerability**: Product descriptions rendered with `dangerouslySetInnerHTML`
- **Test**: Create product with description: `<script>alert('XSS')</script>`
- **Remediation**: Sanitize HTML content or use text-only rendering

#### 3. File Upload Vulnerabilities (High Risk)

- **Location**: `backend/src/routes/products.ts:151-186` and `backend/src/routes/upload.ts:26-57`
- **Vulnerability**: Path traversal, insufficient file validation
- **Test**: Upload with filename: `../../../etc/passwd`
- **Remediation**: Validate file types, sanitize filenames, restrict upload directory

#### 4. Information Disclosure (Medium Risk)

- **Location**: Multiple error handlers in backend routes
- **Vulnerability**: Detailed error messages expose internal structure
- **Test**: Send malformed requests to trigger errors
- **Remediation**: Return generic error messages, log details internally

#### 5. Permissive CORS (Medium Risk)

- **Location**: `backend/src/index.ts:23-26`
- **Vulnerability**: Allows requests from any origin
- **Test**: Make cross-origin requests from different domains
- **Remediation**: Restrict CORS to specific trusted origins

#### 6. Insecure Payment Processing (Low Risk)

- **Location**: `backend/src/routes/checkout.ts:188-192`
- **Vulnerability**: Predictable payment failures for testing
- **Test**: Multiple checkout attempts to observe patterns
- **Remediation**: Implement proper payment gateway integration

### Secure Mode (`VULN_MODE=false`)

When disabled, the application implements security best practices:

- Parameterized database queries
- Input validation and sanitization
- Restricted CORS policies
- Generic error messages
- File upload restrictions
- Security headers

## Testing Commands

### Smoke Tests

```bash
# Test product listing
curl http://localhost:4000/api/products

# Test image upload
curl -X POST http://localhost:4000/api/upload-image \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","dataBase64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="}'

# Test product creation
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"Test description","price":29.99}'

# Test checkout
curl -X POST http://localhost:4000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"cart":[{"productId":1,"quantity":1,"price":29.99}],"billing":{"name":"Test User","email":"test@example.com","address":"123 Test St"}}'

# Access uploaded image
curl http://localhost:4000/images/test.jpg
```

### Security Testing Examples

```bash
# SQL Injection test (VULN_MODE=true)
curl "http://localhost:4000/api/products?search=' OR 1=1 --"

# Path traversal test (VULN_MODE=true)
curl -X POST http://localhost:4000/api/upload-image \
  -H "Content-Type: application/json" \
  -d '{"filename":"../../../etc/passwd","dataBase64":"test"}'

# XSS payload (VULN_MODE=true)
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"XSS\")</script>","description":"XSS test","price":1}'
```

## File Structure

```
e-commerce/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript type definitions
│   │   └── main.tsx        # Application entry point
│   ├── Dockerfile          # Frontend container configuration
│   └── nginx.conf          # Nginx configuration
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── db.ts           # Database connection and utilities
│   │   └── index.ts        # Express server setup
│   ├── init-db.sql         # Database initialization script
│   └── Dockerfile          # Backend container configuration
├── data/
│   └── images/             # Persistent image storage
├── docker-compose.yml      # Multi-service orchestration
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Development

### Local Development Setup

```bash
# Start database only
docker-compose up db

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run backend in development mode
cd backend && npm run dev

# Run frontend in development mode
cd frontend && npm run dev
```

### Environment Variables

Key configuration options:

- `VULN_MODE`: Enable/disable security vulnerabilities
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Backend server port
- `NODE_ENV`: Environment mode

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 4000, 5432 are available
2. **Database connection**: Wait for PostgreSQL to fully initialize
3. **Image upload fails**: Check `./data/images` directory permissions
4. **Build failures**: Ensure sufficient Docker resources

### Logs

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f
```

### Reset Application

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove built images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Ethics and Legal Notice

🚨 **IMPORTANT**: This application is designed for educational purposes and authorized security testing only.

### Legal Requirements

- Only test on systems you own or have explicit written permission to test
- Obtain proper authorization before conducting any security assessments
- Follow responsible disclosure practices for any real vulnerabilities found
- Comply with local and international laws regarding computer security testing

### Ethical Guidelines

- Use this tool responsibly and ethically
- Do not use vulnerabilities to cause harm or access unauthorized systems
- Share knowledge to improve security, not to exploit systems
- Respect privacy and data protection principles

## Contributing

This project is for educational purposes. When contributing:

1. Clearly mark any intentional vulnerabilities with `// INTENTIONAL_VULN:` comments
2. Provide remediation guidance for each vulnerability
3. Ensure secure defaults when `VULN_MODE=false`
4. Update documentation for new features or vulnerabilities

## License

This project is provided for educational purposes. Use responsibly and in accordance with applicable laws.

---

**Remember**: The goal is to learn about security vulnerabilities in a safe, controlled environment. Always practice ethical hacking and responsible disclosure.
