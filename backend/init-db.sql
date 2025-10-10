-- E-commerce Database Schema
-- This script initializes the PostgreSQL database with tables and seed data

-- Create database if not exists (handled by docker-compose)
-- CREATE DATABASE ecommerce;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address TEXT,
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- Images metadata table (optional, for tracking uploaded images)
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data
-- Test admin user (password will be hashed in secure mode, plaintext in VULN_MODE)
-- Default password: admin123
INSERT INTO users (username, email, password_hash, is_admin) VALUES 
('admin', 'admin@example.com', '$2b$10$rOz9kW8yVTgVZGVX5YBW0e5qV2KhR3jKlFJh8zU8qK8mN5vF2hP1C', true),
('testuser', 'test@example.com', '$2b$10$rOz9kW8yVTgVZGVX5YBW0e5qV2KhR3jKlFJh8zU8qK8mN5vF2hP1C', false)
ON CONFLICT (username) DO NOTHING;

-- Sample products
INSERT INTO products (name, description, price, stock_quantity) VALUES 
('Wireless Headphones', 'High-quality wireless headphones with noise cancellation. Perfect for music lovers and professionals.', 99.99, 50),
('Smart Watch', 'Feature-rich smartwatch with health monitoring, GPS, and long battery life.', 199.99, 30),
('Laptop Stand', 'Ergonomic aluminum laptop stand for better posture and cooling.', 49.99, 100),
('Coffee Mug', 'Premium ceramic coffee mug with temperature retention technology.', 24.99, 200),
('Desk Lamp', 'LED desk lamp with adjustable brightness and color temperature.', 79.99, 75),
('Phone Case', 'Protective phone case with military-grade drop protection.', 19.99, 150),
('Bluetooth Speaker', 'Portable Bluetooth speaker with 360-degree sound and waterproof design.', 89.99, 60),
('Webcam', '4K webcam with auto-focus and noise reduction for video calls.', 129.99, 40)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecommerce_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecommerce_user;