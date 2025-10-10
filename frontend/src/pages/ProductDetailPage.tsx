import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../components/CartContext";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch product"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          productId: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        });
      }
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container" {...({} as any)}>
        <div className="loading" {...({} as any)}>
          <div className="spinner" {...({} as any)}></div>
          <p {...({} as any)}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" {...({} as any)}>
        <div className="alert alert-error" {...({} as any)}>
          <h3 {...({} as any)}>Product Not Found</h3>
          <p {...({} as any)}>{error || "Product does not exist"}</p>
          <Link to="/" className="btn btn-primary" {...({} as any)}>
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" {...({} as any)}>
      <nav className="breadcrumb" {...({} as any)}>
        <Link to="/" {...({} as any)}>
          Products
        </Link>
        <span {...({} as any)}> / </span>
        <span {...({} as any)}>{product.name}</span>
      </nav>

      <div className="product-detail" {...({} as any)}>
        <div className="product-image-section" {...({} as any)}>
          <img
            src={product.image_url || "/images/placeholder.jpg"}
            alt={product.name}
            className="product-detail-image"
            onError={(e) => {
              e.currentTarget.src = "/images/placeholder.jpg";
            }}
            {...({} as any)}
          />
        </div>

        <div className="product-info-section" {...({} as any)}>
          <h1 className="product-title" {...({} as any)}>
            {product.name}
          </h1>
          <p className="product-price" {...({} as any)}>
            ${product.price.toFixed(2)}
          </p>

          <div className="product-description" {...({} as any)}>
            <h3 {...({} as any)}>Description</h3>
            <p {...({} as any)}>
              {product.description || "No description available."}
            </p>
          </div>

          <div className="product-actions" {...({} as any)}>
            <div className="quantity-selector" {...({} as any)}>
              <label htmlFor="quantity" {...({} as any)}>
                Quantity:
              </label>
              <div className="quantity-controls" {...({} as any)}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="btn btn-small"
                  disabled={quantity <= 1}
                  {...({} as any)}
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="quantity-input"
                  {...({} as any)}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="btn btn-small"
                  {...({} as any)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="add-to-cart-section" {...({} as any)}>
              <button
                onClick={handleAddToCart}
                className={`btn btn-primary ${
                  addedToCart ? "btn-success" : ""
                }`}
                {...({} as any)}
              >
                {addedToCart ? "Added to Cart!" : "Add to Cart"}
              </button>
              <p className="total-price" {...({} as any)}>
                Total: ${(product.price * quantity).toFixed(2)}
              </p>
            </div>

            <div className="action-links" {...({} as any)}>
              <Link to="/" className="btn btn-outline" {...({} as any)}>
                Continue Shopping
              </Link>
              <Link to="/cart" className="btn btn-secondary" {...({} as any)}>
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="product-features" {...({} as any)}>
        <h3 {...({} as any)}>Product Features</h3>
        <ul {...({} as any)}>
          <li {...({} as any)}>High quality materials</li>
          <li {...({} as any)}>Fast shipping available</li>
          <li {...({} as any)}>30-day return policy</li>
          <li {...({} as any)}>Customer support included</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductDetailPage;
