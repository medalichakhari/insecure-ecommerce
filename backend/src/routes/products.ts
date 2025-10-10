import { Router, Request, Response } from "express";
import { query, Product } from "../db";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const router = Router();

// Environment variables - for now hardcoded for build
const VULN_MODE = "true"; // Can be toggled via ENV later

// Get all products with pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Search functionality
    const search = req.query.search as string;

    let productsQuery = "";
    let countQuery = "";
    let queryParams: any[] = [];

    if (search) {
      // INTENTIONAL_VULN: When VULN_MODE=true, use unsafe string concatenation for SQL
      // This creates SQL injection vulnerabilities for security testing
      // FIX: Always use parameterized queries with placeholder values
      if (VULN_MODE === "true") {
        // Vulnerable: Direct string concatenation
        productsQuery = `SELECT * FROM products WHERE name ILIKE '%${search}%' OR description ILIKE '%${search}%' ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        countQuery = `SELECT COUNT(*) FROM products WHERE name ILIKE '%${search}%' OR description ILIKE '%${search}%'`;
        queryParams = []; // No parameters for vulnerable version
      } else {
        // Safe: Parameterized query
        productsQuery = `SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
        countQuery = `SELECT COUNT(*) FROM products WHERE name ILIKE $1 OR description ILIKE $1`;
        queryParams = [`%${search}%`, limit, offset];
      }
    } else {
      productsQuery = `SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      countQuery = `SELECT COUNT(*) FROM products`;
      queryParams = search ? [`%${search}%`] : [];

      if (!search) {
        queryParams = [limit, offset];
      }
    }

    // Execute queries
    const [productsResult, countResult] = await Promise.all([
      query<Product>(
        productsQuery,
        search && VULN_MODE !== "true" ? queryParams : search ? [] : queryParams
      ),
      query<{ count: string }>(
        countQuery,
        search && VULN_MODE !== "true" ? [`%${search}%`] : search ? [] : []
      ),
    ]);

    const products = productsResult.rows.map((product: any) => ({
      ...product,
      price: parseFloat(product.price), // Convert price string to number
    }));
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    // INTENTIONAL_VULN: In VULN_MODE, expose detailed database errors
    // This helps attackers understand the database structure
    // FIX: Return generic error messages and log details internally
    if (VULN_MODE === "true") {
      res.status(500).json({
        error: "Database error",
        details: error instanceof Error ? error.message : "Unknown error",
        query: req.query, // Exposing query parameters
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch products",
      });
    }
  }
});

// Get single product by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    const result = await query<Product>(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const product = {
      ...(result.rows[0] as any),
      price: parseFloat((result.rows[0] as any).price), // Convert price string to number
    };

    res.json(product);
  } catch (error) {
    // Log error - removed for build compatibility
    res.status(500).json({
      error: "Failed to fetch product",
    });
  }
  return; // Explicit return to satisfy TypeScript
});

// Create new product (admin functionality)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, price, imageBase64 } = req.body;

    // Basic validation
    if (!name || !price) {
      return res.status(400).json({
        error: "Name and price are required",
      });
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        error: "Price must be a positive number",
      });
    }

    let imageUrl = null;

    // Handle image upload if provided
    if (imageBase64) {
      try {
        // Extract base64 data (remove data:image/...;base64, prefix if present)
        const base64Data = imageBase64.replace(
          /^data:image\/[a-z]+;base64,/,
          ""
        );

        // INTENTIONAL_VULN: In VULN_MODE, minimal file validation allows malicious uploads
        // This enables testing for file upload vulnerabilities and path traversal
        // FIX: Implement proper file type validation, size limits, and content scanning
        if (VULN_MODE === "true") {
          // Minimal validation - allows potential security issues
          if (base64Data.length > 50 * 1024 * 1024) {
            // 50MB limit (too generous)
            return res.status(400).json({ error: "File too large" });
          }
        } else {
          // Proper validation
          if (base64Data.length > 5 * 1024 * 1024) {
            // 5MB limit
            return res
              .status(400)
              .json({ error: "Image file too large (max 5MB)" });
          }

          // Validate base64 format
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
            return res.status(400).json({ error: "Invalid image format" });
          }
        }

        // Generate unique filename
        const fileExtension = "jpg"; // Default extension
        const fileName = `product_${Date.now()}_${crypto
          .randomBytes(8)
          .toString("hex")}.${fileExtension}`;
        const filePath = path.join("/app/data/images", fileName);

        // INTENTIONAL_VULN: In VULN_MODE, allow path traversal in filename
        // This enables testing for directory traversal vulnerabilities
        // FIX: Sanitize filename and validate the final path is within allowed directory
        let finalPath: string;
        if (VULN_MODE === "true") {
          // Allow potential path traversal (dangerous)
          const userFileName = req.body.filename || fileName;
          finalPath = path.join("/app/data/images", userFileName);
        } else {
          // Safe: Use only generated filename
          finalPath = filePath;
        }

        // Convert base64 to buffer and save file
        const binaryData = atob(base64Data);
        const imageBuffer = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          imageBuffer[i] = binaryData.charCodeAt(i);
        }
        fs.writeFileSync(finalPath, imageBuffer);

        imageUrl = `/images/${path.basename(finalPath)}`;
      } catch (imageError) {
        // Log error - removed for build compatibility
        return res.status(400).json({
          error: "Failed to process image",
        });
      }
    }

    // Insert product into database
    const result = await query<Product>(
      `INSERT INTO products (name, description, price, image_url, stock_quantity) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, description || "", parseFloat(price), imageUrl, 100] // Default stock
    );

    const createdProduct = {
      ...(result.rows[0] as any),
      price: parseFloat((result.rows[0] as any).price), // Convert price string to number
    };

    res.status(201).json({
      message: "Product created successfully",
      product: createdProduct,
    });
  } catch (error) {
    // Log error - removed for build compatibility

    if (VULN_MODE === "true") {
      res.status(500).json({
        error: "Failed to create product",
        details: error instanceof Error ? error.message : "Unknown error",
        requestBody: req.body, // Exposing request data
      });
    } else {
      res.status(500).json({
        error: "Failed to create product",
      });
    }
  }
  return; // Explicit return to satisfy TypeScript
});

export { router as productRoutes };
