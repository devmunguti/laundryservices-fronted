import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🧺</span>
          <span className="brand-name">Laundry Express</span>
        </Link>
        <nav className="navbar-links">
          <Link to="/">Home</Link>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login" className="cleaners-link">
            ⚡ Cleaner Login
          </Link>
        </nav>
        <div className="navbar-actions">
          <Link to="/login" className="btn-secondary">Login</Link>
          <button className="btn-primary">Book Now</button>
        </div>
      </div>
    </header>
  );
}
