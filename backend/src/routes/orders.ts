import { Router, Request, Response } from "express";
import { query, transaction } from "../db";
import * as dotenv from "dotenv";

dotenv.config();

const router = Router();

// Interface for order creation request
interface CreateOrderRequest {
  items: {
    productId: number;
    name: string;
    price: number;
    quantity: number;
  }[];
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentInfo: {
    cardLast4: string;
    cardType: string;
  };
  total: number;
}

// INTENTIONAL_VULN: SQL Injection in order search
// When VULN_MODE is enabled, this endpoint is vulnerable to SQL injection
// GET /api/orders/search?status=pending' OR '1'='1
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    if (process.env.VULN_MODE === "true") {
      // VULN: Direct SQL concatenation without parameterization
      const searchQuery = `SELECT * FROM orders WHERE status = '${status}' ORDER BY created_at DESC`;
      const result = await query(searchQuery);
      return res.json(result.rows);
    } else {
      // SECURE: Parameterized query
      const result = await query(
        "SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC",
        [status]
      );
      return res.json(result.rows);
    }
  } catch (error) {
    console.error("Error searching orders:", error);
    return res.status(500).json({ error: "Failed to search orders" });
  }
});

// Create a new order
router.post("/", async (req: Request, res: Response) => {
  try {
    const orderData: CreateOrderRequest = req.body;

    if (!orderData.items || orderData.items.length === 0) {
      return res
        .status(400)
        .json({ error: "Order must contain at least one item" });
    }

    const result = await transaction(async (client) => {
      // Create the order
      const orderResult = await client.query(
        `INSERT INTO orders (total_amount, status, billing_name, billing_email, billing_address, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, created_at`,
        [
          orderData.total,
          "pending",
          `${orderData.shippingInfo.firstName} ${orderData.shippingInfo.lastName}`,
          orderData.shippingInfo.email,
          `${orderData.shippingInfo.address}, ${orderData.shippingInfo.city}, ${orderData.shippingInfo.state} ${orderData.shippingInfo.zipCode}`,
        ]
      );

      const orderId = orderResult.rows[0].id;

      // Insert order items
      for (const item of orderData.items) {
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
      }

      return {
        orderId,
        status: "success",
        createdAt: orderResult.rows[0].created_at,
      };
    });

    // INTENTIONAL_VULN: Information disclosure
    // In VULN_MODE, we return sensitive debug information
    if (process.env.VULN_MODE === "true") {
      return res.json({
        ...result,
        debug: {
          paymentInfo: orderData.paymentInfo,
          internalOrderData: orderData,
          databaseResult: result,
        },
      });
    } else {
      return res.json(result);
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

// Get order by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // INTENTIONAL_VULN: Access control bypass
    // In VULN_MODE, any user can access any order without authentication
    if (process.env.VULN_MODE === "true") {
      const orderResult = await query(
        `SELECT o.*, 
                array_agg(
                  json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price,
                    'product_name', p.name
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = $1
         GROUP BY o.id`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json(orderResult.rows[0]);
    } else {
      // SECURE: In production, this would check user authentication and authorization
      return res.status(401).json({ error: "Authentication required" });
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Get all orders (admin only in secure mode)
router.get("/", async (_req: Request, res: Response) => {
  try {
    // INTENTIONAL_VULN: Missing authorization check
    // In VULN_MODE, anyone can access all orders
    if (process.env.VULN_MODE === "true") {
      const ordersResult = await query(
        `SELECT o.id, o.total_amount, o.status, o.billing_name, o.billing_email, o.created_at,
                COUNT(oi.id) as item_count
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      );

      return res.json(ordersResult.rows);
    } else {
      // SECURE: In production, this would require admin authentication
      return res.status(401).json({ error: "Admin authentication required" });
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Update order status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // INTENTIONAL_VULN: Mass assignment vulnerability
    // In VULN_MODE, we allow updating any field from the request body
    if (process.env.VULN_MODE === "true") {
      const updateFields = Object.keys(req.body)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");

      const values = [id, ...Object.values(req.body)];

      const result = await query(
        `UPDATE orders SET ${updateFields} WHERE id = $1 RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json(result.rows[0]);
    } else {
      // SECURE: Only allow updating the status field
      const result = await query(
        "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ error: "Failed to update order" });
  }
});

// Delete order (admin only)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // INTENTIONAL_VULN: No authentication check in VULN_MODE
    if (process.env.VULN_MODE === "true") {
      const result = await query(
        "DELETE FROM orders WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json({
        message: "Order deleted successfully",
        deletedOrder: result.rows[0],
      });
    } else {
      // SECURE: In production, this would require admin authentication
      return res.status(401).json({ error: "Admin authentication required" });
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
