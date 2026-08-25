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
  const [customCategory, setCustomCategory] = useState('');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);

  const [pricingType, setPricingType] = useState('per_kg');
  const [customPricingType, setCustomPricingType] = useState('');
  const [isNewPricingMode, setIsNewPricingMode] = useState(false);

  const [basePrice, setBasePrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('200');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Saved Lists State
  const [savedCategories, setSavedCategories] = useState([
    'Wash & Fold',
    'Dry Cleaning',
    'Ironing & Pressing',
    'Bedding & Linens',
    'Express Delivery',
    'Shoe Cleaning',
    'Curtains & Drapes',
    'Specialty Care'
  ]);

  const [savedPricingModels, setSavedPricingModels] = useState([
    { value: 'per_kg', label: 'Per Kg' },
    { value: 'per_item', label: 'Per Item' },
    { value: 'flat', label: 'Flat Rate' },
    { value: 'per_pair', label: 'Per Pair' },
    { value: 'per_meter', label: 'Per Meter' },
    { value: 'per_bundle', label: 'Per Bundle' }
  ]);

  // Load custom saved categories & pricing models on mount & when services change
  const syncCustomOptions = useCallback((currentServices = []) => {
    try {
      // 1. Categories
      const storedCategories = JSON.parse(localStorage.getItem('cleaner_custom_categories') || '[]');
      const serviceCategories = currentServices.map(s => s.category).filter(Boolean);
      const mergedCategories = Array.from(new Set([
        'Wash & Fold',
        'Dry Cleaning',
        'Ironing & Pressing',
        'Bedding & Linens',
        'Express Delivery',
        'Shoe Cleaning',
        'Curtains & Drapes',
        'Specialty Care',
        ...storedCategories,
        ...serviceCategories
      ]));
      setSavedCategories(mergedCategories);

      // 2. Pricing Models
      const storedPricing = JSON.parse(localStorage.getItem('cleaner_custom_pricing_models') || '[]');
      const servicePricing = currentServices.map(s => s.pricingType).filter(Boolean);
      
      const defaultModels = [
        { value: 'per_kg', label: 'Per Kg' },
        { value: 'per_item', label: 'Per Item' },
        { value: 'flat', label: 'Flat Rate' },
        { value: 'per_pair', label: 'Per Pair' },
        { value: 'per_meter', label: 'Per Meter' },
        { value: 'per_bundle', label: 'Per Bundle' }
      ];

      const customEntries = [...storedPricing, ...servicePricing].map(val => {
        if (typeof val === 'object' && val.value) return val;
        const formattedLabel = String(val).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return { value: String(val).toLowerCase().replace(/\s+/g, '_'), label: formattedLabel };
      });

      const uniqueModelsMap = new Map();
      [...defaultModels, ...customEntries].forEach(item => {
        if (item && item.value && !uniqueModelsMap.has(item.value)) {
          uniqueModelsMap.set(item.value, item);
        }
      });

      setSavedPricingModels(Array.from(uniqueModelsMap.values()));
    } catch (e) {
      console.warn('Failed to parse custom service options from localStorage:', e);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await serviceApi.getServices({ myServices: 'true' });
      if (res.success && res.data) {
        setServices(res.data);
        syncCustomOptions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  }, [syncCustomOptions]);

  useEffect(() => {
    syncCustomOptions();
    fetchServices();
  }, [fetchServices, syncCustomOptions]);

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!name || !basePrice) return;

    // Resolve final category
    const finalCategory = isNewCategoryMode ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      toast.error('Please specify a category name.');
      return;
    }

    // Resolve final pricing model
    let finalPricingType = pricingType;
    let finalPricingLabel = pricingType;
    if (isNewPricingMode) {
      const trimmedPricing = customPricingType.trim();
      if (!trimmedPricing) {
        toast.error('Please specify a pricing model name.');
        return;
      }
      finalPricingType = trimmedPricing.toLowerCase().replace(/\s+/g, '_');
      finalPricingLabel = trimmedPricing;
    }

    try {
      setSubmitting(true);
      const res = await serviceApi.createService({
        name,
        category: finalCategory,
        pricingType: finalPricingType,
        basePrice: parseFloat(basePrice),
        deliveryFee: parseFloat(deliveryFee || 0),
        description
      });
      if (res.success) {
        toast.success(`Service "${name}" created successfully!`);

        // Persist newly created category for future dropdown selections
        try {
          const currentStoredCats = JSON.parse(localStorage.getItem('cleaner_custom_categories') || '[]');
          if (!currentStoredCats.includes(finalCategory)) {
            const updatedCats = [...currentStoredCats, finalCategory];
            localStorage.setItem('cleaner_custom_categories', JSON.stringify(updatedCats));
          }

          // Persist newly created pricing model for future dropdown selections
          const currentStoredModels = JSON.parse(localStorage.getItem('cleaner_custom_pricing_models') || '[]');
          const modelObj = { value: finalPricingType, label: finalPricingLabel };
          if (!currentStoredModels.some(m => (m.value || m) === finalPricingType)) {
            const updatedModels = [...currentStoredModels, modelObj];
            localStorage.setItem('cleaner_custom_pricing_models', JSON.stringify(updatedModels));
          }
        } catch (e) { }

        await fetchServices();
        setIsAddModalOpen(false);
        setName('');
        setBasePrice('');
        setDeliveryFee('200');
        setDescription('');
        setIsNewCategoryMode(false);
        setCustomCategory('');
        setIsNewPricingMode(false);
        setCustomPricingType('');
        setCategory(finalCategory);
        setPricingType(finalPricingType);
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

  // Helper to format pricing label
  const formatPricingDisplay = (type) => {
    const found = savedPricingModels.find(m => m.value === type);
    if (found) return found.label;
    if (type === 'per_kg') return 'per KG';
    if (type === 'per_item') return 'per Item';
    if (type === 'flat') return 'flat rate';
    return type?.replace(/_/g, ' ') || 'per unit';
  };

  const mainContent = (
    <div className="flex flex-col w-full h-full font-body-md text-on-surface py-4 gap-stack-gap-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/40">
        <div>
          <h1 className="font-headline-lg text-on-surface m-0">Services &amp; Pricing Catalog</h1>
          <p className="font-body-md text-on-surface-variant m-0 mt-1">Manage active laundry offerings and custom pricing models.</p>
        </div>
        <button
          onClick={() => {
            setIsNewCategoryMode(false);
            setIsNewPricingMode(false);
            setIsAddModalOpen(true);
          }}
          className="bg-primary text-on-primary font-label-md px-6 py-3 rounded-xl shadow-md flex items-center gap-2 hover:bg-primary-container cursor-pointer transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span> Add New Service
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-primary flex justify-center items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
          Loading services catalog...
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant font-body-md bg-surface-container-lowest rounded-2xl border border-surface-container/40">
          No services created yet. Click 'Add New Service' to create your first offering.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-gap-md">
          {services.map((svc) => (
            <div key={svc._id} className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container/40 flex flex-col justify-between shadow-xs hover:border-primary/30 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-sm uppercase px-3 py-1 bg-secondary-container/20 text-secondary rounded-full font-semibold">
                    {svc.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(svc._id, svc.isActive)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-colors ${svc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'
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
                <span className="font-headline-md text-primary font-bold">KES {svc.basePrice?.toLocaleString()}</span>
                <span className="font-body-sm text-on-surface-variant capitalize">
                  {formatPricingDisplay(svc.pricingType)}
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
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-lg w-full p-6 border border-surface-container/60 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-surface-container/40 pb-3">
              <div>
                <h3 className="font-headline-md text-on-surface font-bold">Add New Service</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Define offerings, categories, and custom pricing models.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateService} className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block font-label-sm text-on-surface mb-1 font-semibold">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duvet Deep Cleaning / Wedding Gown Wash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Dynamic Category Section */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-label-sm text-on-surface font-semibold">Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCategoryMode(!isNewCategoryMode);
                      if (!isNewCategoryMode) setCustomCategory('');
                    }}
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isNewCategoryMode ? 'list' : 'add_circle'}
                    </span>
                    {isNewCategoryMode ? 'Choose from saved' : '+ Add new category'}
                  </button>
                </div>

                {isNewCategoryMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Enter new custom category (e.g. Wedding Gowns)"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none border border-primary/40 focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-[11px] text-on-surface-variant">
                      ✨ This category will be saved automatically and added to your selectable dropdown for future services.
                    </p>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsNewCategoryMode(true);
                        setCustomCategory('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    {savedCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__NEW__" className="text-primary font-bold">+ Add New Custom Category...</option>
                  </select>
                )}
              </div>

              {/* Dynamic Pricing Model Section */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-label-sm text-on-surface font-semibold">Pricing Model *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPricingMode(!isNewPricingMode);
                      if (!isNewPricingMode) setCustomPricingType('');
                    }}
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isNewPricingMode ? 'list' : 'add_circle'}
                    </span>
                    {isNewPricingMode ? 'Choose from saved' : '+ Add new pricing model'}
                  </button>
                </div>

                {isNewPricingMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Enter pricing unit (e.g. Per Suit, Per Square Foot, Per Load)"
                      value={customPricingType}
                      onChange={(e) => setCustomPricingType(e.target.value)}
                      className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none border border-primary/40 focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-[11px] text-on-surface-variant">
                      ✨ This pricing model will be saved automatically and added to your selectable options for future services.
                    </p>
                  </div>
                ) : (
                  <select
                    value={pricingType}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsNewPricingMode(true);
                        setCustomPricingType('');
                      } else {
                        setPricingType(e.target.value);
                      }
                    }}
                    className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  >
                    {savedPricingModels.map((model) => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                    <option value="__NEW__" className="text-primary font-bold">+ Add New Custom Pricing Model...</option>
                  </select>
                )}
              </div>

              {/* Price & Delivery Fee Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-on-surface mb-1 font-semibold">Base Price (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 250"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-on-surface mb-1 font-semibold">Pickup &amp; Delivery (KES)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 (Free) or 200"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-label-sm text-on-surface mb-1 font-semibold">Service Description</label>
                <textarea
                  placeholder="Describe your process, turnaround time, fabric care, or special notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container py-2.5 px-4 rounded-lg font-body-sm outline-none h-20 focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-surface-container/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg font-label-md bg-primary text-on-primary shadow-sm hover:bg-primary-container cursor-pointer disabled:opacity-50 transition-all font-semibold"
                >
                  {submitting ? 'Saving Service...' : 'Save & Publish Service'}
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
