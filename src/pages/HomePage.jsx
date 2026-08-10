import React from 'react';
import './HomePage.css';

export default function HomePage() {
  const services = [
    { title: 'Wash & Fold', desc: 'Everyday laundry washed, dried, and neatly folded.', icon: '🧺', price: '$2.50 / kg' },
    { title: 'Dry Cleaning', desc: 'Premium suit, dress, and delicate garment care.', icon: '👔', price: '$8.00 / item' },
    { title: 'Ironing & Press', desc: 'Crisp, wrinkle-free clothes ready to wear.', icon: '🔌', price: '$1.75 / item' },
    { title: 'Express Pickup', desc: 'Same-day pickup and delivery at your doorstep.', icon: '🚚', price: 'Free on $30+' },
  ];

  return (
    <div className="home-page">
      <section className="hero-banner">
        <div className="hero-content">
          <h1>Fresh & Clean Laundry Delivered to Your Door</h1>
          <p>Schedule your pickup in seconds. We wash, dry, fold, and deliver back to you within 24 hours.</p>
          <div className="hero-buttons">
            <button className="btn-primary btn-large">Schedule Pickup</button>
            <button className="btn-secondary btn-large">Explore Services</button>
          </div>
        </div>
      </section>

      <section className="services-section" id="services">
        <h2>Our Popular Services</h2>
        <div className="services-grid">
          {services.map((item, idx) => (
            <div key={idx} className="service-card">
              <span className="service-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <div className="service-price">{item.price}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
