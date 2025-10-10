import { Router, Request, Response } from "express";
import { query, transaction } from "../db";
import * as crypto from "crypto";

const router = Router();

// Environment variables - for now hardcoded for build
const VULN_MODE = "true"; // Can be toggled via ENV later

interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

interface CheckoutRequest {
  cart: CartItem[];
  billing: {
    name: string;
    email: string;
    address: string;
  };
}

// Checkout endpoint
router.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { cart, billing }: CheckoutRequest = req.body;

    // Basic validation
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        error: "Cart is required and must contain at least one item",
      });
    }

    if (!billing || !billing.name || !billing.email) {
      return res.status(400).json({
        error: "Billing information (name and email) is required",
      });
    }

    // INTENTIONAL_VULN: In VULN_MODE, skip email validation
    // This allows testing for input validation bypasses
    // FIX: Implement proper email format validation
    if (VULN_MODE !== "true") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(billing.email)) {
        return res.status(400).json({
          error: "Invalid email format",
        });
      }
    }

    // Calculate total and validate products
    let totalAmount = 0;
    const validatedItems: Array<CartItem & { productName: string }> = [];

    for (const item of cart) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          error: "Invalid cart item format",
        });
      }

      // Fetch product to validate and get current price
      const productResult = await query(
        "SELECT id, name, price, stock_quantity FROM products WHERE id = $1",
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        return res.status(400).json({
          error: `Product with ID ${item.productId} not found`,
        });
      }

      const product = productResult.rows[0];

      // Check stock availability
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
        });
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(product.price),
        productName: product.name,
      });
    }

    // Simulate payment processing
    const shouldSucceed = simulatePayment(totalAmount);

    if (!shouldSucceed) {
      return res.status(402).json({
        error: "Payment processing failed",
        message: "Your payment could not be processed. Please try again.",
        code: "PAYMENT_DECLINED",
      });
    }

    // Process the order in a transaction
    const result = await transaction(async (client) => {
      // Create order record
      const orderResult = await client.query(
        `INSERT INTO orders (total_amount, status, billing_name, billing_email, billing_address, transaction_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [
          totalAmount,
          "completed",
          billing.name,
          billing.email,
          billing.address || "",
          generateTransactionId(),
        ]
      );

      const orderId = orderResult.rows[0].id;

      // Create order items and update stock
      for (const item of validatedItems) {
        // Insert order item
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            orderId,
            item.productId,
            item.quantity,
            item.price,
            item.price * item.quantity,
          ]
        );

        // Update product stock
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.productId]
        );
      }

      return { orderId };
    });

    // Return success response
    res.status(201).json({
      message: "Order processed successfully",
      orderId: result.orderId,
      totalAmount,
      transactionId: generateTransactionId(),
      items: validatedItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      })),
      billing,
      status: "completed",
      redirectUrl: `/thank-you?order=${result.orderId}`,
    });
  } catch (error) {
    // Log error - removed for build compatibility

    // INTENTIONAL_VULN: In VULN_MODE, expose detailed error information
    // This helps attackers understand internal application structure
    // FIX: Return generic error messages and log details internally
    if (VULN_MODE === "true") {
      res.status(500).json({
        error: "Checkout processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        requestData: req.body,
      });
    } else {
      res.status(500).json({
        error: "Checkout processing failed",
        message: "Please try again later",
      });
    }
  }
  return; // Explicit return to satisfy TypeScript
});

// Helper function to simulate payment processing
function simulatePayment(amount: number): boolean {
  // INTENTIONAL_VULN: In VULN_MODE, introduce random payment failures for testing
  // This simulates real-world payment processing issues but in a predictable way
  // FIX: Implement proper payment gateway integration with retry logic
  if (VULN_MODE === "true") {
    // 10% failure rate in vulnerable mode for testing error handling
    return Math.random() > 0.1;
  } else {
    // In secure mode, payments succeed for amounts less than $1000
    // (simulated business logic)
    return amount < 1000;
  }
}

// Helper function to generate mock transaction ID
function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const randomPart = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `TXN_${timestamp}_${randomPart}`;
}

export { router as checkoutRoutes };
