import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";

const UserAvatar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="auth-links">
        <Link to="/login" className="btn btn-outline btn-small">
          Login
        </Link>
        <Link to="/register" className="btn btn-primary btn-small">
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="user-avatar-container" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="user-avatar-trigger"
      >
        <div className="avatar">{getInitials(user.username)}</div>
        <span className="username-display">{user.username}</span>
        <svg
          className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.427 9.573L8 6l3.573 3.573l.854-.853L8 4.293 3.573 8.72l.854.853z" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">{user.username}</div>
            <div className="user-email">{user.email}</div>
            <div className="user-role">
              <span
                className={`badge ${
                  user.isAdmin ? "badge-primary" : "badge-secondary"
                }`}
              >
                {user.isAdmin ? "Admin" : "User"}
              </span>
            </div>
          </div>

          <hr className="dropdown-divider" />

          <div className="dropdown-actions">
            {user.isAdmin && (
              <Link
                to="/admin"
                className="dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2zM3 7v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
                </svg>
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="dropdown-item logout-item"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z" />
                <path d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
