import { Link } from "react-router-dom";
import { useCart } from "./CartContext";
import UserAvatar from "./UserAvatar";

const Header = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="logo">
            🛒 E-Shop
          </Link>

          <div className="nav-center">
            <ul className="nav-links">
              <li>
                <Link to="/">Products</Link>
              </li>
              <li>
                <Link to="/cart">
                  Cart
                  {totalItems > 0 && (
                    <span className="cart-badge">{totalItems}</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>

          <div className="nav-right">
            <UserAvatar />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
