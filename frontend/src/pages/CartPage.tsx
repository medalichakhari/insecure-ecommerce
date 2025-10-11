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
        <button
          onClick={clearCart}
          className="btn btn-outline btn-small"
          disabled={cartItems.length === 0}
        >
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
                        src={
                          item.image_url ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHJlY3QgeD0iNTAlIiB5PSI1MCUiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcng9IjgiIGZpbGw9IiNkMWQ1ZGIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00MCwgLTQwKSIvPgogIDxwYXRoIGQ9Ik01MCA2MCBMNzAgODAgTDkwIDYwIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iNjUiIGN5PSI3MCIgcj0iMyIgZmlsbD0iIzZiNzI4MCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2YjcyODAiPlByb2R1Y3QgSW1hZ2U8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSIyNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzljYTNhZiI+SW1hZ2Ugbm90IGF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+"
                        }
                        alt={item.name}
                        onError={(e: any) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHJlY3QgeD0iNTAlIiB5PSI1MCUiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcng9IjgiIGZpbGw9IiNkMWQ1ZGIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00MCwgLTQwKSIvPgogIDxwYXRoIGQ9Ik01MCA2MCBMN5AgODAgTDkwIDYwIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iNjUiIGN5PSI3MCIgcj0iMyIgZmlsbD0iIzZiNzI4MCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2YjcyODAiPlByb2R1Y3QgSW1hZ2U8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSIyNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzljYTNhZiI+SW1hZ2Ugbm90IGF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+";
                        }}
                        className="w-24 h-24 object-cover rounded border"
                        style={{ width: "6rem", height: "6rem" }}
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
                        <div
                          className="flex items-center border rounded"
                          style={{ border: "1px solid var(--border-color)" }}
                        >
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="px-3 py-1 hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                            style={{
                              backgroundColor:
                                item.quantity <= 1 ? "#f5f5f5" : "transparent",
                              cursor:
                                item.quantity <= 1 ? "not-allowed" : "pointer",
                            }}
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
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-16 px-2 py-1 text-center border-0 focus:outline-none"
                            style={{ width: "4rem" }}
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
          <div className="card sticky top-4">
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
