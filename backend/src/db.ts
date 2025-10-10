import { Pool, PoolClient } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database query interface
export interface DatabaseQueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: any[];
}

// Main query function with error handling
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<DatabaseQueryResult<T>> {
  const client: PoolClient = await pool.connect();

  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      oid: result.oid,
      fields: result.fields,
    } as DatabaseQueryResult<T>;
  } catch (error) {
    // INTENTIONAL_VULN: When VULN_MODE is enabled, we expose detailed database errors
    // This helps attackers understand the database structure and identify injection points
    // FIX: In production, log detailed errors internally but return generic error messages
    if (process.env.VULN_MODE === "true") {
      console.error("Database Error (VULN_MODE):", error);
      throw error; // Expose full error details
    } else {
      console.error("Database Error:", error);
      throw new Error("Database operation failed");
    }
  } finally {
    client.release();
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Database health check
export async function healthCheck(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
}

// Types for database entities
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  created_at: Date;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // Change from string to number for frontend compatibility
  image_url?: string;
  stock_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  user_id?: number;
  total_amount: number;
  status: string;
  billing_name: string;
  billing_email: string;
  billing_address: string;
  transaction_id?: string;
  created_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ImageRecord {
  id: number;
  filename: string;
  original_filename?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: Date;
}
