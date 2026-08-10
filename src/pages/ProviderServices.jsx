import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function cleanersServices({ isStandalone = true, onNavigateTab }) {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wash & Fold');
  const [pricingType, setPricingType] = useState('per_kg');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/services');
      const json = await res.json();
      if (json.success && json.data) {
        setServices(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!name || !basePrice) return;

    try {
      const res = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          pricingType,
          basePrice: parseFloat(basePrice),
          description
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchServices();
        setIsAddModalOpen(false);
        setName('');
        setBasePrice('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create service in MongoDB:', err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service from catalog?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/services/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchServices();
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const mainContent = (
    <div className="flex flex-col w-full h-full font-body-md text-on-surface py-4 gap-stack-gap-md">
      <div className="flex justify-between items-center bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/40">
        <div>
          <h1 className="font-headline-lg text-on-surface m-0">Services & Pricing Catalog</h1>
          <p className="font-body-md text-on-surface-variant m-0 mt-1">Manage active laundry offerings and prices stored in MongoDB.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-on-primary font-label-md px-6 py-3 rounded-xl shadow-md flex items-center gap-2 hover:bg-primary-container cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span> Add New Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-gap-md">
        {services.map((svc) => (
          <div key={svc._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/40 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-sm uppercase px-3 py-1 bg-secondary-container/20 text-secondary rounded-full font-semibold">
                  {svc.category}
                </span>
                <button
                  onClick={() => handleDeleteService(svc._id)}
                  className="text-on-surface-variant hover:text-error transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <h3 className="font-headline-md text-on-surface mb-1">{svc.name}</h3>
              <p className="font-body-sm text-on-surface-variant mb-4">{svc.description || 'Standard service offering.'}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-surface-container/40">
              <span className="font-headline-md text-primary">KES {svc.basePrice}</span>
              <span className="font-label-sm text-on-surface-variant">/ {svc.pricingType?.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-surface-container/60 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <h3 className="font-headline-md text-on-surface">Add New Service</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duvet Deep Cleaning"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none"
                >
                  <option value="Wash & Fold">Wash & Fold</option>
                  <option value="Dry Cleaning">Dry Cleaning</option>
                  <option value="Ironing & Pressing">Ironing & Pressing</option>
                  <option value="Bedding & Linens">Bedding & Linens</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Base Price (KES)</label>
                <input
                  type="number"
                  required
                  placeholder="150"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Description</label>
                <textarea
                  placeholder="Brief description of this service..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none h-20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg font-label-md text-on-surface-variant">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary">
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-background p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}

