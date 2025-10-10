import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { healthCheck } from "./db";

// Load environment variables
dotenv.config();

// Import route handlers
import { productRoutes } from "./routes/products";
import { uploadRoutes } from "./routes/upload";
import { checkoutRoutes } from "./routes/checkout";
import ordersRouter from "./routes/orders";
import authRouter from "./routes/auth";

const app: Application = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const corsOptions = {
  // INTENTIONAL_VULN: When VULN_MODE=true, allow permissive CORS for easier testing
  // This enables cross-origin attacks and CSRF vulnerabilities
  // FIX: Restrict origin to specific domains and disable credentials for untrusted origins
  origin:
    process.env.VULN_MODE === "true"
      ? "*"
      : ["http://localhost:3000", "http://localhost:5173"],
  credentials: process.env.VULN_MODE === "true" ? true : false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" })); // Allow large base64 images
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (process.env.VULN_MODE !== "true") {
    // Secure headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  // INTENTIONAL_VULN: In VULN_MODE, we omit security headers to allow testing
  // This makes the application vulnerable to clickjacking, MIME sniffing, etc.
  // FIX: Always set appropriate security headers
  next();
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);

  // INTENTIONAL_VULN: In VULN_MODE, log request bodies which may contain sensitive data
  // This could expose passwords, tokens, and other sensitive information in logs
  // FIX: Never log request bodies, especially those containing authentication data
  if (process.env.VULN_MODE === "true" && req.body) {
    console.log("Request body (VULN_MODE):", JSON.stringify(req.body, null, 2));
  }

  next();
});

// Serve static images from the mounted volume
app.use("/images", express.static("/app/data/images"));

// API Routes
app.use("/api/products", productRoutes);
app.use("/api", uploadRoutes);
app.use("/api", checkoutRoutes);
app.use("/api/orders", ordersRouter);
app.use("/api/auth", authRouter);

// Health check endpoint
app.get("/healthz", async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await healthCheck();

    if (dbHealthy) {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        vulnerabilityMode: process.env.VULN_MODE === "true",
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      });
    }
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: "Health check failed",
    });
  }
});

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "E-commerce API Server",
    version: "1.0.0",
    endpoints: {
      products: "/api/products",
      upload: "/api/upload-image",
      checkout: "/api/checkout",
      health: "/healthz",
      images: "/images",
    },
    vulnerabilityMode: process.env.VULN_MODE === "true",
    documentation:
      "See README.md for API documentation and security testing guidelines",
  });
});

// Global error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", error);

  // INTENTIONAL_VULN: In VULN_MODE, return detailed error information
  // This exposes internal application structure and stack traces to attackers
  // FIX: Return generic error messages and log details internally
  if (process.env.VULN_MODE === "true") {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: error.stack, // Dangerous: exposes code structure
      details: error,
    });
  } else {
    res.status(500).json({
      error: "Internal server error",
      message: "Something went wrong",
    });
  }
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /",
      "GET /healthz",
      "GET /api/products",
      "GET /api/products/:id",
      "POST /api/products",
      "POST /api/upload-image",
      "POST /api/checkout",
      "GET /images/:filename",
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 E-commerce API server running on port ${PORT}`);
  console.log(
    `🔒 Vulnerability mode: ${
      process.env.VULN_MODE === "true" ? "ENABLED" : "DISABLED"
    }`
  );
  console.log(`📋 Available at: http://localhost:${PORT}`);
  console.log(`🖼️  Static images served from: /images`);

  if (process.env.VULN_MODE === "true") {
    console.log("⚠️  WARNING: Application is running in VULNERABILITY MODE");
    console.log(
      "⚠️  This mode contains intentional security flaws for testing purposes"
    );
    console.log("⚠️  DO NOT use this mode in production environments");
  }
});

export default app;
