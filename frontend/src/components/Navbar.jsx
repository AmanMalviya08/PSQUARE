import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e) {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <Link className="nav-brand" to="/">PSQUARE</Link>

        <button
          ref={btnRef}
          className={`nav-toggle ${isOpen ? 'active' : ''}`}
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="primary-navigation"
          ref={menuRef}
          className={`nav-menu ${isOpen ? 'open' : ''}`}
        >
          <ul
            className="nav-links"
            role="menubar"
            aria-hidden={!isOpen && window.innerWidth < 769}
          >
            <li role="none">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' active' : '')
                }
                role="menuitem"
              >
                Home
              </NavLink>
            </li>

            {/* {user && user.role !== 'admin' && (
              <li role="none">
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? ' active' : '')
                  }
                  role="menuitem"
                >
                  My Bookings
                </NavLink>
              </li>
            )} */}

            {/* hide Profile link on admin routes and for admin users */}
            {user && !isAdminRoute && user.role !== 'admin' && (
              <li role="none">
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? ' active' : '')
                  }
                  role="menuitem"
                >
                  Profile
                </NavLink>
              </li>
            )}

            {user?.role === 'admin' && (
              <li role="none">
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? ' active' : '')
                  }
                  role="menuitem"
                >
                  Admin
                </NavLink>
              </li>
            )}
          </ul>

          <ul className="nav-actions">
            {!user ? (
              <>
                <li>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      'nav-link' + (isActive ? ' active' : '')
                    }
                  >
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/signup"
                    className={({ isActive }) =>
                      'nav-link' + (isActive ? ' active' : '')
                    }
                  >
                    Signup
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                {/* hide greeting/profile display on admin routes */}
                {!isAdminRoute && (
                  <li className="nav-user" title={user.email}>
                    Hello, {user.name}
                  </li>
                )}
                <li>
                  <button
                    className="btn-logout"
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
