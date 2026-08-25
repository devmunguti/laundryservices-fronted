import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceApi } from '../api/serviceApi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function ProviderServices({ isStandalone = true, onNavigateTab }) {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Deletion Modal State
  const [deleteTargetService, setDeleteTargetService] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wash & Fold');
  const [pricingType, setPricingType] = useState('per_kg');
  const [basePrice, setBasePrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('200');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await serviceApi.getServices({ myServices: 'true' });
      if (res.success && res.data) {
        setServices(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!name || !basePrice) return;

    try {
      setSubmitting(true);
      const res = await serviceApi.createService({
        name,
        category,
        pricingType,
        basePrice: parseFloat(basePrice),
        deliveryFee: parseFloat(deliveryFee || 0),
        description
      });
      if (res.success) {
        toast.success(`Service "${name}" created successfully!`);
        await fetchServices();
        setIsAddModalOpen(false);
        setName('');
        setBasePrice('');
        setDeliveryFee('200');
        setDescription('');
      } else {
        toast.error(res.message || 'Failed to create service.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await serviceApi.toggleServiceStatus(id, !currentStatus);
      if (res.success) {
        toast.success(`Service ${!currentStatus ? 'activated' : 'disabled'}`);
        await fetchServices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle service status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetService) return;
    try {
      setIsDeleting(true);
      const res = await serviceApi.deleteService(deleteTargetService._id);
      if (res.success) {
        toast.success(`Service "${deleteTargetService.name}" removed from catalog`);
        setDeleteTargetService(null);
        await fetchServices();
      } else {
        toast.error(res.message || 'Failed to delete service.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service.');
    } finally {
      setIsDeleting(false);
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

      {loading ? (
        <div className="py-12 text-center text-primary flex justify-center items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
          Loading services catalog from MongoDB...
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-2xl border border-surface-container/40">
          No services created yet. Click 'Add New Service' to create your first offering.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-gap-md">
          {services.map((svc) => (
            <div key={svc._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/40 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-sm uppercase px-3 py-1 bg-secondary-container/20 text-secondary rounded-full font-semibold">
                    {svc.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(svc._id, svc.isActive)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer ${svc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'
                        }`}
                    >
                      {svc.isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => setDeleteTargetService(svc)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                      title="Delete service"
                      aria-label={`Delete ${svc.name}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-headline-md text-on-surface mb-1">{svc.name}</h3>
                <p className="font-body-sm text-on-surface-variant mb-4">{svc.description || 'Standard service offering.'}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-surface-container/40">
                <span className="font-headline-md text-primary">KES {svc.basePrice?.toLocaleString()}</span>
                <span className="font-body-sm text-on-surface-variant">
                  {svc.pricingType === 'per_kg' ? 'per KG' : 'flat item'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Service Deletion */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetService)}
        onClose={() => setDeleteTargetService(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Service Offering"
        itemName={deleteTargetService?.name}
        warningMessage="Are you sure you want to permanently remove this service from your public catalog? Customers will no longer be able to select it."
        confirmText="Delete Service"
        type="danger"
        isLoading={isDeleting}
      />

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
                  <option value="Express Delivery">Express Delivery</option>
                  <option value="Shoe Cleaning">Shoe Cleaning</option>
                  <option value="Specialty Care">Specialty Care</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-on-surface mb-1">Pricing Model</label>
                <select
                  value={pricingType}
                  onChange={(e) => setPricingType(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none"
                >
                  <option value="per_kg">Per Kg</option>
                  <option value="per_item">Per Item</option>
                  <option value="flat">Flat Rate</option>
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
                <label className="block font-label-sm text-on-surface mb-1">Pickup &amp; Delivery Fee (KES) — 0 for Free</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (Free) or 200"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
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
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary shadow-xs cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Service'}
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
