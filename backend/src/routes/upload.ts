import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { query } from "../db";

const router = Router();

// Environment variables - for now hardcoded for build
const VULN_MODE = "true"; // Can be toggled via ENV later

// Upload image endpoint
router.post("/upload-image", async (req: Request, res: Response) => {
  try {
    const { filename, dataBase64 } = req.body;

    if (!dataBase64) {
      return res.status(400).json({
        error: "Missing image data",
      });
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = dataBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    // INTENTIONAL_VULN: In VULN_MODE, allow unrestricted file uploads
    // This enables testing for various file upload vulnerabilities
    // FIX: Implement proper file type validation, size limits, and content scanning
    if (VULN_MODE === "true") {
      // Minimal validation in vulnerable mode
      if (base64Data.length > 100 * 1024 * 1024) {
        // 100MB - too generous
        return res.status(400).json({ error: "File too large" });
      }

      // INTENTIONAL_VULN: Allow user-controlled filename (path traversal risk)
      // This enables testing for directory traversal attacks
      // FIX: Sanitize filename and restrict to safe characters only
      if (filename && typeof filename === "string") {
        // Dangerous: User controls filename completely
        const userFilename = filename;
        const filePath = path.join("/app/data/images", userFilename);

        try {
          // Simplified buffer handling - using atob/btoa for now
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          fs.writeFileSync(filePath, bytes);

          const publicUrl = `/images/${userFilename}`;

          return res.json({
            message: "File uploaded successfully",
            url: publicUrl,
            filename: userFilename,
          });
        } catch (fileError) {
          // Log error - removed for build compatibility
          return res.status(500).json({
            error: "Failed to write file",
            details:
              fileError instanceof Error ? fileError.message : "Unknown error",
          });
        }
      }
    } else {
      // Secure validation
      if (base64Data.length > 5 * 1024 * 1024) {
        // 5MB limit
        return res.status(400).json({ error: "File too large (max 5MB)" });
      }

      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        return res.status(400).json({ error: "Invalid file format" });
      }
    }

    // Generate safe filename
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString("hex");
    const fileExtension = "jpg"; // Default extension
    const safeFilename = `upload_${timestamp}_${randomBytes}.${fileExtension}`;
    const filePath = path.join("/app/data/images", safeFilename);

    try {
      // Simplified buffer handling
      const binaryData = atob(base64Data);
      const imageBuffer = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        imageBuffer[i] = binaryData.charCodeAt(i);
      }
      fs.writeFileSync(filePath, imageBuffer);

      // Save file metadata to database
      await query(
        `INSERT INTO images (filename, original_filename, file_path, file_size) 
         VALUES ($1, $2, $3, $4)`,
        [safeFilename, filename || safeFilename, filePath, imageBuffer.length]
      );

      const publicUrl = `/images/${safeFilename}`;

      res.json({
        message: "Image uploaded successfully",
        url: publicUrl,
        filename: safeFilename,
        size: imageBuffer.length,
      });
    } catch (error) {
      // Log error - removed for build compatibility

      if (VULN_MODE === "true") {
        res.status(500).json({
          error: "Upload failed",
          details: error instanceof Error ? error.message : "Unknown error",
          requestData: { filename, dataLength: base64Data.length },
        });
      } else {
        res.status(500).json({
          error: "Upload failed",
        });
      }
    }
  } catch (error) {
    // Log error - removed for build compatibility
    res.status(500).json({
      error: "Internal server error",
    });
  }
  return; // Explicit return to satisfy TypeScript
});

export { router as uploadRoutes };
