import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import './Navbar.css';

export default function Navbar() {
  const { settings } = useSettings();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.platformName} className="h-7 w-auto object-contain mr-2" />
          ) : (
            <span className="brand-icon">🧺</span>
          )}
          <span className="brand-name">{settings?.platformName || 'Aura Laundry'}</span>
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

