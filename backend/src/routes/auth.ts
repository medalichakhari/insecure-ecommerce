import { Router, Request, Response } from "express";
import { query } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

const router = Router();

// JWT secret key - In production, this should be a strong, random secret
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Interface for user registration/login
interface AuthRequest {
  username: string;
  email?: string;
  password: string;
}

// Helper function to generate JWT token
const generateToken = (userId: number, username: string, isAdmin: boolean) => {
  return jwt.sign({ userId, username, isAdmin }, JWT_SECRET, {
    expiresIn: "24h",
  });
};

// INTENTIONAL_VULN: Weak password hashing when VULN_MODE is enabled
// In VULN_MODE, passwords are stored in plaintext or with weak hashing
const hashPassword = async (password: string): Promise<string> => {
  if (process.env.VULN_MODE === "true") {
    // VULN: Store passwords in plaintext
    return password;
  } else {
    // SECURE: Proper bcrypt hashing with salt rounds
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
};

// INTENTIONAL_VULN: Weak password verification when VULN_MODE is enabled
const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  if (process.env.VULN_MODE === "true") {
    // VULN: Simple string comparison for plaintext passwords
    return password === hash;
  } else {
    // SECURE: Proper bcrypt verification
    return await bcrypt.compare(password, hash);
  }
};

// Register new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password }: AuthRequest = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    // INTENTIONAL_VULN: No input validation in VULN_MODE
    if (process.env.VULN_MODE !== "true") {
      // Basic validation
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }
    }

    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await query(
      "INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin",
      [username, email, hashedPassword, false]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.username, user.is_admin);

    // INTENTIONAL_VULN: Return sensitive information in VULN_MODE
    if (process.env.VULN_MODE === "true") {
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
        },
        token,
        debug: {
          hashedPassword,
          rawPassword: password,
          jwtSecret: JWT_SECRET,
        },
      });
    } else {
      return res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
        },
        token,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password }: AuthRequest = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // INTENTIONAL_VULN: SQL Injection in login when VULN_MODE is enabled
    let userResult;
    if (process.env.VULN_MODE === "true") {
      // VULN: Direct SQL concatenation allows injection
      // Payload: admin' OR '1'='1' --
      const query_str = `SELECT id, username, email, password_hash, is_admin FROM users WHERE username = '${username}'`;
      userResult = await query(query_str);
    } else {
      // SECURE: Parameterized query
      userResult = await query(
        "SELECT id, username, email, password_hash, is_admin FROM users WHERE username = $1",
        [username]
      );
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      // INTENTIONAL_VULN: Detailed error messages in VULN_MODE
      if (process.env.VULN_MODE === "true") {
        return res.status(401).json({
          error: "Password verification failed",
          debug: {
            providedPassword: password,
            storedHash: user.password_hash,
            username: user.username,
          },
        });
      } else {
        return res.status(401).json({ error: "Invalid username or password" });
      }
    }

    const token = generateToken(user.id, user.username, user.is_admin);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Verify token
router.get("/verify", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // INTENTIONAL_VULN: Weak JWT verification in VULN_MODE
    let decoded;
    if (process.env.VULN_MODE === "true") {
      // VULN: No signature verification, accept any JWT
      try {
        decoded = jwt.decode(token) as any;
        if (!decoded) {
          throw new Error("Invalid token");
        }
      } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } else {
      // SECURE: Proper JWT verification
      try {
        decoded = jwt.verify(token, JWT_SECRET) as any;
      } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    // Get fresh user data
    const userResult = await query(
      "SELECT id, username, email, is_admin FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Token verification failed" });
  }
});

// Get user profile (requires authentication)
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const userResult = await query(
      "SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
});

// INTENTIONAL_VULN: Admin user enumeration endpoint (VULN_MODE only)
router.get("/users", async (_req: Request, res: Response) => {
  if (process.env.VULN_MODE === "true") {
    try {
      const users = await query(
        "SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC"
      );

      return res.json(users.rows);
    } catch (error) {
      console.error("Users enumeration error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  } else {
    return res.status(404).json({ error: "Endpoint not found" });
  }
});

export default router;
