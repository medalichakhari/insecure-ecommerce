import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface OrderDetails {
  orderId: string;
  orderTotal: number;
  estimatedDelivery?: string;
}

const ThankYouPage = () => {
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // Get order details from navigation state (passed from checkout)
    if (location.state) {
      const { orderId, orderTotal } = location.state as OrderDetails;

      // Calculate estimated delivery (5-7 business days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);

      setOrderDetails({
        orderId,
        orderTotal,
        estimatedDelivery: deliveryDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    }
  }, [location.state]);

  return (
    <div className="container" {...({} as any)}>
      <div className="thank-you-page" {...({} as any)}>
        <div className="success-icon" {...({} as any)}>
          <div className="checkmark" {...({} as any)}>
            ✓
          </div>
        </div>

        <h1 className="thank-you-title" {...({} as any)}>
          Thank You for Your Order!
        </h1>
        <p className="thank-you-subtitle" {...({} as any)}>
          Your order has been successfully placed and is being processed.
        </p>

        {orderDetails && (
          <div className="order-confirmation" {...({} as any)}>
            <div className="card" {...({} as any)}>
              <div className="card-header" {...({} as any)}>
                <h2 {...({} as any)}>Order Confirmation</h2>
              </div>
              <div className="card-content" {...({} as any)}>
                <div className="confirmation-details" {...({} as any)}>
                  <div className="detail-row" {...({} as any)}>
                    <span className="label" {...({} as any)}>
                      Order Number:
                    </span>
                    <span className="value order-id" {...({} as any)}>
                      {orderDetails.orderId}
                    </span>
                  </div>
                  <div className="detail-row" {...({} as any)}>
                    <span className="label" {...({} as any)}>
                      Total Amount:
                    </span>
                    <span className="value" {...({} as any)}>
                      ${orderDetails.orderTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-row" {...({} as any)}>
                    <span className="label" {...({} as any)}>
                      Estimated Delivery:
                    </span>
                    <span className="value" {...({} as any)}>
                      {orderDetails.estimatedDelivery}
                    </span>
                  </div>
                  <div className="detail-row" {...({} as any)}>
                    <span className="label" {...({} as any)}>
                      Order Status:
                    </span>
                    <span className="value status-processing" {...({} as any)}>
                      Processing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="next-steps" {...({} as any)}>
          <div className="card" {...({} as any)}>
            <div className="card-header" {...({} as any)}>
              <h3 {...({} as any)}>What Happens Next?</h3>
            </div>
            <div className="card-content" {...({} as any)}>
              <div className="steps" {...({} as any)}>
                <div className="step" {...({} as any)}>
                  <div className="step-number" {...({} as any)}>
                    1
                  </div>
                  <div className="step-content" {...({} as any)}>
                    <h4 {...({} as any)}>Order Confirmation</h4>
                    <p {...({} as any)}>
                      You'll receive an email confirmation shortly with your
                      order details.
                    </p>
                  </div>
                </div>
                <div className="step" {...({} as any)}>
                  <div className="step-number" {...({} as any)}>
                    2
                  </div>
                  <div className="step-content" {...({} as any)}>
                    <h4 {...({} as any)}>Processing</h4>
                    <p {...({} as any)}>
                      Our team will prepare your items for shipment within 1-2
                      business days.
                    </p>
                  </div>
                </div>
                <div className="step" {...({} as any)}>
                  <div className="step-number" {...({} as any)}>
                    3
                  </div>
                  <div className="step-content" {...({} as any)}>
                    <h4 {...({} as any)}>Shipping</h4>
                    <p {...({} as any)}>
                      You'll receive tracking information once your order ships.
                    </p>
                  </div>
                </div>
                <div className="step" {...({} as any)}>
                  <div className="step-number" {...({} as any)}>
                    4
                  </div>
                  <div className="step-content" {...({} as any)}>
                    <h4 {...({} as any)}>Delivery</h4>
                    <p {...({} as any)}>
                      Your order will be delivered to your specified address.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="customer-support" {...({} as any)}>
          <h3 {...({} as any)}>Need Help?</h3>
          <p {...({} as any)}>
            If you have any questions about your order, please contact our
            customer support team.
          </p>
          <div className="support-info" {...({} as any)}>
            <div className="support-item" {...({} as any)}>
              <strong {...({} as any)}>Email:</strong> support@e-shop.com
            </div>
            <div className="support-item" {...({} as any)}>
              <strong {...({} as any)}>Phone:</strong> 1-800-123-4567
            </div>
            <div className="support-item" {...({} as any)}>
              <strong {...({} as any)}>Hours:</strong> Monday - Friday, 9 AM - 6
              PM EST
            </div>
          </div>
        </div>

        <div className="action-buttons" {...({} as any)}>
          <Link to="/" className="btn btn-primary" {...({} as any)}>
            Continue Shopping
          </Link>
          {orderDetails && (
            <button
              onClick={() => window.print()}
              className="btn btn-outline"
              {...({} as any)}
            >
              Print Order Details
            </button>
          )}
        </div>

        <div className="marketing-section" {...({} as any)}>
          <h3 {...({} as any)}>While You Wait...</h3>
          <p {...({} as any)}>
            Follow us on social media for updates, exclusive offers, and product
            announcements!
          </p>
          <div className="social-links" {...({} as any)}>
            <a href="#" className="social-link" {...({} as any)}>
              Facebook
            </a>
            <a href="#" className="social-link" {...({} as any)}>
              Twitter
            </a>
            <a href="#" className="social-link" {...({} as any)}>
              Instagram
            </a>
            <a href="#" className="social-link" {...({} as any)}>
              YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
