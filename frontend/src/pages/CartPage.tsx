import { useCart } from "../components/CartContext";
import { Link } from "react-router-dom";

const CartPage = () => {
  const {
    cart: cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body text-center">
            <div className="mb-4">
              <svg
                className="w-24 h-24 mx-auto text-muted mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ width: "6rem", height: "6rem" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.8 9.2M7 13l2.5-5m0 0L16 8m0 0v5a2 2 0 01-2 2H9a2 2 0 01-2-2V8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-primary">
              Your cart is empty
            </h2>
            <p className="text-secondary mb-4">
              Discover amazing products and add them to your cart to get
              started.
            </p>
            <Link to="/" className="btn btn-primary btn-large">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Shopping Cart</h1>
        <button onClick={clearCart} className="btn btn-outline btn-small">
          Clear Cart
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="space-y-4">
            {cartItems.map((item: any) => (
              <div key={item.productId} className="card">
                <div className="card-body">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image_url || "/images/placeholder.jpg"}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder.jpg";
                        }}
                        className="w-24 h-24 object-cover rounded border"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.name}
                      </h3>
                      <p className="text-secondary text-sm mb-2">
                        ${item.price.toFixed(2)} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-medium">Quantity:</span>
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="px-3 py-1 hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 px-2 py-1 text-center border-0 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="px-3 py-1 hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Item Total and Actions */}
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold text-primary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="btn btn-danger btn-small"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:w-80">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Order Summary</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>
                    Subtotal (
                    {cartItems.reduce(
                      (total: number, item: any) => total + item.quantity,
                      0
                    )}{" "}
                    items)
                  </span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-success">Free</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link to="/checkout" className="btn btn-primary btn-full">
                  Proceed to Checkout
                </Link>
                <Link to="/" className="btn btn-outline btn-full">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
