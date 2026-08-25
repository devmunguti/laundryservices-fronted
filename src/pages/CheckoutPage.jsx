import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();

  // Track Order Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Retrieve order details passed from catalog / shop page or fallback to defaults
  const orderData = location.state || {
    serviceName: 'Standard Wash & Fold',
    category: 'Wash & Fold',
    details: '1 Bag (approx. 5kg)',
    servicePrice: 1200,
    deliveryOption: 'Standard Pickup & Delivery',
    deliveryPrice: 200,
    tillNumber: '8995354',
    providerName: 'Partner Cleaner',
  };

  const totalAmount = (Number(orderData.servicePrice) || 0) + (Number(orderData.deliveryPrice) || 0);

  // Multi-step state: 1 = Details & Pickup Point, 2 = M-Pesa Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Client & Pickup Details
  const [clientName, setClientName] = useState(user?.fullName || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [pickupAddress, setPickupAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Payment states
  const [activeOrder, setActiveOrder] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('');
  const [stkLoading, setStkLoading] = useState(false);
  const [stkSuccess, setStkSuccess] = useState(false);
  const [stkError, setStkError] = useState('');
  const [stkCountdown, setStkCountdown] = useState(60);
  const [copied, setCopied] = useState(false);
  const pollIntervalRef = React.useRef(null);
  const countdownIntervalRef = React.useRef(null);

  // Manual confirmation states
  const [manualInputMode, setManualInputMode] = useState('code');
  const [transactionCode, setTransactionCode] = useState('');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [extractedCode, setExtractedCode] = useState(null);

  // Keep phone prefilled if client phone is typed in Step 1
  useEffect(() => {
    if (clientPhone && !phone) {
      setPhone(clientPhone);
    }
  }, [clientPhone, phone]);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocatingGps(false);
        toast.success('Live GPS coordinates captured!');
        if (!pickupAddress) {
          setPickupAddress(`GPS Pin (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
      },
      (err) => {
        console.warn('GPS location error:', err);
        setLocatingGps(false);
        toast.error('Could not retrieve GPS coordinates. Please enter your address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Step 1 Validation & Proceed to Step 2
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setStep1Error('');

    if (!clientName.trim()) {
      setStep1Error('Please enter your full name.');
      return;
    }
    const cleanPh = clientPhone.trim().replace(/\s+/g, '');
    if (!cleanPh || cleanPh.length < 9) {
      setStep1Error('Please enter a valid phone number (e.g. 0712345678).');
      return;
    }
    if (!pickupAddress.trim()) {
      setStep1Error('Please specify your pickup area, street, or apartment name.');
      return;
    }

    setPhone(cleanPh);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to ensure order exists in MongoDB
  const getOrCreateOrder = async (activeServiceId) => {
    if (activeOrder?._id) {
      return activeOrder;
    }

    const effectiveStreet = pickupAddress.trim() || 'Nairobi';

    const orderRes = await orderApi.createOrder({
      items: [
        {
          serviceId: activeServiceId,
          quantity: Number(orderData.quantity) || 1
        }
      ],
      customerDetails: {
        fullName: clientName.trim() || 'Valued Customer',
        phone: clientPhone.trim() || phone.trim() || '',
        email: clientEmail.trim() || ''
      },
      pickupAddress: {
        street: effectiveStreet,
        city: 'Nairobi',
        houseNumber: houseNumber.trim(),
        instructions: pickupInstructions.trim(),
        coordinates: gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng, accuracy: gpsCoords.accuracy } : undefined,
        liveLocationUrl: gpsCoords ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : ''
      },
      deliveryAddress: {
        street: effectiveStreet,
        city: 'Nairobi',
        houseNumber: houseNumber.trim()
      },
      notes: pickupInstructions.trim()
    });

    if (!orderRes.success || !orderRes.data?.order?._id) {
      throw new Error(orderRes.message || 'Failed to create order.');
    }

    setActiveOrder(orderRes.data.order);
    return orderRes.data.order;
  };

  const handleCancelStk = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setStkLoading(false);
    setPaymentStatusMsg('');
    setStkError('M-Pesa payment prompt cancelled. You can try again or use the Till number below.');
  };

  // Poll backend for PayHero payment confirmation
  const pollPaymentStatus = (paymentId, fallbackOrderRef) => {
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds total at 2s interval
    setStkCountdown(60);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // 1-second countdown ticker
    countdownIntervalRef.current = setInterval(() => {
      setStkCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await paymentApi.getPaymentStatus(paymentId);
        const paymentData = res.data;
        if (res.success && paymentData) {
          const currentStatus = (paymentData.status || '').toLowerCase();

          if (currentStatus === 'paid') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setStkLoading(false);
            setStkSuccess(true);
            const orderRef = paymentData?.orderRef || fallbackOrderRef;
            setPaymentStatusMsg('Payment confirmed! Redirecting to your order tracking page...');
            setTimeout(() => {
              navigate(orderRef ? `/track-order/${orderRef}` : '/');
            }, 1200);
          } else if (currentStatus === 'cancelled') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setStkLoading(false);
            setStkError('M-Pesa payment request was cancelled on your phone.');
            setPaymentStatusMsg('');
          } else if (currentStatus === 'expired') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setStkLoading(false);
            setStkError('The payment request expired. Please try initiating a new payment.');
            setPaymentStatusMsg('');
          } else if (currentStatus === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setStkLoading(false);
            setStkError(paymentData.failureReason || 'M-Pesa payment could not be completed.');
            setPaymentStatusMsg('');
          } else {
            setPaymentStatusMsg('Waiting for M-Pesa confirmation... Check your phone and enter PIN.');
          }
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }

      if (attempts >= maxAttempts) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setStkLoading(false);
        setStkError('M-Pesa prompt timed out. You can re-send prompt or confirm via M-Pesa message below.');
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Handle STK Push Request
  const handleStkPush = async (e) => {
    e.preventDefault();
    setStkError('');
    setStkSuccess(false);
    setPaymentStatusMsg('');

    const cleanPhone = (phone || clientPhone).trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setStkError('Please enter a valid M-Pesa phone number (e.g. 0712345678)');
      return;
    }

    try {
      setStkLoading(true);

      const activeServiceId = orderData.serviceId || orderData._id;
      if (!activeServiceId) {
        setStkError('No valid service selected. Please return to catalog.');
        setStkLoading(false);
        return;
      }

      const currentOrder = await getOrCreateOrder(activeServiceId);
      const createdOrderId = currentOrder._id;
      const createdOrderRef = currentOrder.orderRef;

      const payRes = await paymentApi.checkoutPayment({
        orderId: createdOrderId,
        paymentMethod: 'mpesa',
        phoneNumber: cleanPhone
      });

      if (payRes.success && payRes.data?.paymentId) {
        setPaymentStatusMsg('Check your phone for the M-Pesa prompt and enter your PIN.');
        pollPaymentStatus(payRes.data.paymentId, createdOrderRef);
      } else {
        setStkError(payRes.message || 'Unable to send M-Pesa prompt. Please try again or use the Till number.');
        setStkLoading(false);
      }
    } catch (err) {
      setStkError(err.response?.data?.message || err.message || 'Error processing payment checkout.');
      setStkLoading(false);
    }
  };

  // Handle Manual Transaction Code Verification
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setConfirmError('');
    setExtractedCode(null);

    const isMessageMode = manualInputMode === 'message';
    const code = isMessageMode ? null : transactionCode.trim().toUpperCase();
    const message = isMessageMode ? mpesaMessage.trim() : null;

    if (!isMessageMode && (!code || code.length < 6)) {
      setConfirmError('Please enter a valid M-Pesa transaction code (e.g. QKT1234567).');
      return;
    }
    if (isMessageMode && (!message || message.length < 20)) {
      setConfirmError('Please paste your full M-Pesa confirmation SMS message.');
      return;
    }

    try {
      setConfirmLoading(true);

      const activeServiceId = orderData.serviceId || orderData._id;
      if (!activeServiceId) {
        setConfirmError('No valid service selected.');
        setConfirmLoading(false);
        return;
      }

      const currentOrder = await getOrCreateOrder(activeServiceId);
      const createdOrderId = currentOrder._id;
      const createdOrderRef = currentOrder.orderRef;

      const verifyRes = await paymentApi.verifyManualPayment({
        orderId: createdOrderId,
        ...(isMessageMode ? { message } : { transactionCode: code })
      });

      const targetRef = verifyRes.orderRef || createdOrderRef;

      if (verifyRes.success && (verifyRes.state === 'CONFIRMED' || verifyRes.state === 'ALREADY_PAID')) {
        setConfirmSuccess(true);
        setExtractedCode(verifyRes.transactionCode || code);
        setTimeout(() => {
          navigate(`/track-order/${targetRef}`);
        }, 1500);
      } else if (verifyRes.orderRef) {
        setConfirmSuccess(true);
        setExtractedCode(verifyRes.transactionCode || code);
        setTimeout(() => {
          navigate(`/track-order/${verifyRes.orderRef}`);
        }, 1500);
      } else {
        const stateMessages = {
          EXTRACTION_FAILED: `Could not extract a transaction code from your message. ${verifyRes.hint || 'Please paste the full SMS.'}`,
          INVALID_CODE_FORMAT: `"${verifyRes.extractedCode || code}" is not a valid M-Pesa receipt code.`,
          AMOUNT_MISMATCH: `Amount mismatch. Expected KES ${verifyRes.expected}, message shows KES ${verifyRes.received}.`,
          ALREADY_USED: 'This M-Pesa transaction code has already been used for another order.',
        };
        setConfirmError(stateMessages[verifyRes.state] || verifyRes.message || 'Failed to verify transaction code.');
      }
    } catch (err) {
      const respData = err.response?.data;
      if (respData?.orderRef) {
        setConfirmSuccess(true);
        setExtractedCode(respData.transactionCode || code);
        setTimeout(() => {
          navigate(`/track-order/${respData.orderRef}`);
        }, 1500);
        return;
      }
      setConfirmError(respData?.message || err.message || 'Error confirming payment.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const cleanQuery = trackingInput.trim();
    if (!cleanQuery) {
      setTrackingError('Please enter your M-Pesa code or Order #');
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingError('');
      const res = await orderApi.getOrderTracking(cleanQuery);

      if (res.success && res.data?.orderRef) {
        setIsTrackingModalOpen(false);
        setTrackingInput('');
        navigate(`/track-order/${res.data.orderRef}`);
      } else {
        setTrackingError(res.message || 'No order found with this M-Pesa code or Order number.');
      }
    } catch (err) {
      setTrackingError(err.response?.data?.message || 'Order not found. Please verify your M-Pesa transaction code or order number.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const tillNumber = orderData.tillNumber || '8995354';
  const providerName = orderData.providerName || 'Partner Cleaner';
  const providerId = orderData.providerId || null;

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen">
      {/* Enhanced Checkout Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl z-40 flex items-center justify-between px-4 sm:px-6 lg:px-12 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        {/* Left: Dynamic Back Button & Home Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentStep === 2) {
                setCurrentStep(1);
              } else if (providerId) {
                navigate(`/cleaner/${providerId}`);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors bg-surface-container px-3 sm:px-3.5 py-2 rounded-full cursor-pointer shrink-0"
            title={currentStep === 2 ? 'Return to Step 1' : 'Back to Shop'}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="hidden sm:inline">
              {currentStep === 2 ? 'Edit Details' : providerId ? `${providerName} Shop` : 'All Cleaners'}
            </span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Home Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container hover:bg-primary/10 text-on-surface hover:text-primary transition-all group cursor-pointer border border-outline-variant/30 hover:border-primary/40 font-semibold text-xs shrink-0"
            title="Go to Home"
            aria-label="Home"
          >
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">home</span>
            <span className="font-bold">Home</span>
          </button>

          {/* Platform / Brand Name */}
          <div className="hidden md:flex flex-col ml-1">
            <span className="font-headline-md text-headline-md text-primary tracking-tight font-bold leading-tight">
              {settings?.platformName || 'Oduori Laundry'}
            </span>
          </div>
        </div>

        {/* Center: Cleaner Storefront & Security Badge */}
        <div className="hidden lg:flex items-center gap-3">
          <div
            onClick={() => providerId && navigate(`/cleaner/${providerId}`)}
            className={`flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${providerId ? 'cursor-pointer hover:bg-primary/20' : ''}`}
            title="Assigned Cleaner Storefront"
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>{providerName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-surface-container px-3 py-1.5 rounded-full font-medium">
            <span className="material-symbols-outlined text-emerald-600 text-[15px]">verified_user</span>
            <span>256-Bit SSL Secured</span>
          </div>
        </div>

        {/* Right: Track Order, Support & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Track Order Button */}
          <button
            type="button"
            onClick={() => {
              setIsTrackingModalOpen(true);
              setTrackingError('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-outline-variant/40 hover:bg-surface-container text-xs font-bold text-on-surface transition-colors cursor-pointer"
            title="Track previous order"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
            <span className="hidden sm:inline">Track Order</span>
          </button>

          {/* User Account / Portal Access */}
          {isAuthenticated && user ? (
            user.role === 'admin' ? (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-3.5 py-2 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center gap-1 shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span className="hidden sm:inline">Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/provider')}
                className="px-3.5 py-2 rounded-full bg-primary text-on-primary font-semibold text-xs flex items-center gap-1 shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">dry_cleaning</span>
                <span className="hidden sm:inline">Portal</span>
              </button>
            )
          ) : (
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center text-on-primary shadow-sm cursor-pointer"
              onClick={() => navigate('/login')}
              title="Access Portal Login"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </button>
          )}
        </div>
      </header>

      {/* Interactive Track Order Modal */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-outline-variant/30 space-y-5 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsTrackingModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Track Previous Order</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Enter your M-Pesa receipt code or Order reference.
                </p>
              </div>
            </div>

            {/* Tracking Search Form */}
            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  M-Pesa Code or Order #
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    receipt_long
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. QKT1234567 or ORD-102938"
                    value={trackingInput}
                    onChange={(e) => {
                      setTrackingInput(e.target.value);
                      if (trackingError) setTrackingError('');
                    }}
                    className="w-full bg-surface-container py-3 pl-11 pr-4 rounded-xl text-sm font-mono text-on-surface outline-none border border-outline-variant/30 focus:border-primary focus:bg-surface transition-all uppercase placeholder:normal-case placeholder:font-sans"
                  />
                </div>
                <span className="text-[11px] text-on-surface-variant mt-1.5 block">
                  💡 Tip: You can paste the 10-character code from your M-Pesa SMS.
                </span>
              </div>

              {trackingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{trackingError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trackingLoading || !trackingInput.trim()}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {trackingLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">search</span>
                      <span>Find Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="relative pt-24 pb-20 px-4 md:px-8 max-w-[840px] mx-auto min-h-screen">
        {/* Step Progress Indicator */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container/60 mb-8 mt-2">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Step 1 Pill */}
            <div
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${currentStep === 1 ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === 1 ? 'bg-primary text-on-primary shadow-xs' : 'bg-emerald-100 text-emerald-800'}`}>
                {currentStep > 1 ? <span className="material-symbols-outlined text-[16px]">check</span> : '1'}
              </div>
              <span className="text-xs md:text-sm">Details &amp; Pickup</span>
            </div>

            {/* Divider Line */}
            <div className={`flex-1 h-0.5 mx-4 transition-all ${currentStep === 2 ? 'bg-primary' : 'bg-surface-container-high'}`}></div>

            {/* Step 2 Pill */}
            <div className={`flex items-center gap-2 transition-all ${currentStep === 2 ? 'text-primary font-bold' : 'text-on-surface-variant/60 font-medium'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === 2 ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container-high text-on-surface-variant'}`}>
                2
              </div>
              <span className="text-xs md:text-sm">M-Pesa Payment</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: YOUR DETAILS & PICKUP POINT */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Compact Order Summary Card */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-surface-container/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">local_laundry_service</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-lg font-bold text-on-surface">Order Summary</h2>
                    <p className="text-xs text-on-surface-variant">{providerName}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {orderData.category || 'Laundry Service'}
                </span>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-surface-container/60 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">{orderData.serviceName}</span>
                  <span className="font-semibold text-on-surface">KES {Number(orderData.servicePrice).toLocaleString()}</span>
                </div>
                {orderData.details && (
                  <p className="text-xs text-on-surface-variant/80 italic -mt-1">{orderData.details}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">{orderData.deliveryOption || 'Pickup & Delivery'}</span>
                  <span className="font-semibold text-on-surface">
                    {orderData.deliveryPrice === 0 ? 'Free' : `KES ${Number(orderData.deliveryPrice).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-surface-container/60">
                  <span className="font-bold text-base text-on-surface">Total Amount</span>
                  <span className="font-extrabold text-xl text-primary">KES {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Simplified Details & Pickup Form */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-surface-container/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">person_pin_circle</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-xl font-bold text-on-surface">Your Details &amp; Pickup Point</h2>
                  <p className="text-xs text-on-surface-variant">Simple contact and location info for your laundry collection</p>
                </div>
              </div>

              <form onSubmit={handleProceedToPayment} className="space-y-4">
                {/* Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Kimani"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1.5">
                      Phone Number (Calls &amp; Updates) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value);
                        setPhone(e.target.value);
                      }}
                      className="w-full bg-surface-container px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1.5">
                    Email Address <span className="text-xs text-on-surface-variant font-normal">(Optional, for digital receipt)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. alex@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                  />
                </div>

                {/* Clean Pickup Location Section */}
                <div className="pt-3 border-t border-surface-container/60 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-on-surface">
                        Pickup Location / Building / Estate <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={locatingGps}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">my_location</span>
                        <span>{locatingGps ? 'Pinning GPS...' : gpsCoords ? 'GPS Pinned ✓' : 'Use My Current Location'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Kilimani, Wood Avenue Apt / Hall 4 Hostel"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full bg-surface-container px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5">
                        House / Room / Door Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rm 302 / Door B4"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        className="w-full bg-surface-container px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5">
                        Pickup Instructions <span className="text-xs text-on-surface-variant font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Call when at gate, basket is outside"
                        value={pickupInstructions}
                        onChange={(e) => setPickupInstructions(e.target.value)}
                        className="w-full bg-surface-container px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {step1Error && (
                  <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{step1Error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm py-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <span>Proceed to Payment (Step 2 of 2)</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: M-PESA PAYMENT (SPACIOUS & WELL ORGANIZED) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Top Payment Header Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-700/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold rounded-full border border-amber-400/30 inline-flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Secure Checkout • Step 2 of 2
                  </span>
                  <h2 className="text-2xl font-bold">M-Pesa Payment</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Paying to: <strong>{providerName}</strong> (Buy Goods Till: <span className="font-mono text-amber-300 font-bold">{tillNumber}</span>)
                  </p>
                </div>

                <div className="text-left md:text-right bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-xs">
                  <span className="text-xs text-slate-300 block">Total Due</span>
                  <span className="text-2xl font-extrabold text-amber-300">KES {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Client Pickup Summary Brief */}
              <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0">location_on</span>
                  <span className="truncate">Pickup for <strong>{clientName}</strong> at <strong>{pickupAddress}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-amber-300 hover:underline shrink-0 font-semibold cursor-pointer ml-3"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Option 1: STK Push Card (Spacious & Clean) */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-surface-container/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
                  <span className="material-symbols-outlined text-[22px]">phone_android</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Option 1: M-Pesa Express (STK Push)</h3>
                  <p className="text-xs text-on-surface-variant">Enter phone number to receive an instant PIN prompt on your phone</p>
                </div>
              </div>

              <form onSubmit={handleStkPush} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1.5">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (stkError) setStkError('');
                    }}
                    className="w-full bg-surface-container px-4 py-3.5 rounded-xl text-sm font-semibold text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                    required
                  />
                </div>

                {stkError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                    {stkError}
                  </div>
                )}

                {paymentStatusMsg && (
                  <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-blue-600 animate-spin">sync</span>
                    <span className="font-medium">{paymentStatusMsg}</span>
                  </div>
                )}

                {stkSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                    <span>Prompt sent to <strong>{phone}</strong>! Enter your PIN on your phone to complete.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={stkLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {stkLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      <span>Sending M-Pesa Prompt...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send_to_mobile</span>
                      <span>Send STK Prompt (KES {totalAmount.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Option 2: Manual Till Payment & Instant Confirmation */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-surface-container/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Option 2: Pay Directly via Till Number</h3>
                  <p className="text-xs text-on-surface-variant">Pay via Lipa na M-Pesa Buy Goods, then confirm with your code</p>
                </div>
              </div>

              {/* Till Number Display Card */}
              <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between border border-outline-variant/30 my-4">
                <div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Buy Goods Till Number
                  </span>
                  <span className="text-2xl font-extrabold text-primary font-mono tracking-wider">
                    {tillNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tillNumber)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-container-high text-xs font-bold text-primary transition-all flex items-center gap-1.5 border border-outline-variant/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copied!' : 'Copy Till'}</span>
                </button>
              </div>

              {/* Verification Form */}
              <div className="mt-6 pt-4 border-t border-surface-container/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-on-surface">Confirm Payment Code:</span>
                  <div className="flex gap-1 bg-surface-container p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => { setManualInputMode('code'); setConfirmError(''); }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${manualInputMode === 'code' ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant'}`}
                    >
                      Enter Code
                    </button>
                    <button
                      type="button"
                      onClick={() => { setManualInputMode('message'); setConfirmError(''); }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${manualInputMode === 'message' ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant'}`}
                    >
                      Paste SMS
                    </button>
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="space-y-3">
                  {manualInputMode === 'code' ? (
                    <input
                      type="text"
                      placeholder="e.g. QKT1234567"
                      value={transactionCode}
                      onChange={(e) => {
                        setTransactionCode(e.target.value.toUpperCase());
                        if (confirmError) setConfirmError('');
                      }}
                      maxLength={12}
                      className="w-full bg-surface-container px-4 py-3.5 rounded-xl text-sm font-mono tracking-widest uppercase text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      placeholder="Paste your complete M-Pesa SMS message here..."
                      value={mpesaMessage}
                      onChange={(e) => {
                        setMpesaMessage(e.target.value);
                        if (confirmError) setConfirmError('');
                      }}
                      className="w-full bg-surface-container px-4 py-3 rounded-xl text-xs text-on-surface border border-outline-variant/30 focus:border-primary focus:bg-surface outline-none transition-all resize-none"
                    />
                  )}

                  {confirmError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
                      {confirmError}
                    </div>
                  )}

                  {confirmSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                      <span>Payment verified! Code: <strong>{extractedCode || transactionCode}</strong>. Redirecting...</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={confirmLoading || confirmSuccess}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {confirmLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                        <span>Verifying Code...</span>
                      </>
                    ) : confirmSuccess ? (
                      <>
                        <span>Payment Verified ✓</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>Confirm Payment &amp; Track Order</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Back to Step 1 Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Edit Contact or Pickup Location Details</span>
              </button>
            </div>
          </div>
        )}

        {/* M-Pesa STK Waiting & Countdown Modal */}
        {stkLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 border border-surface-container/80 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <span className="material-symbols-outlined text-[36px] animate-pulse">smartphone</span>
              </div>
              <div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface">Waiting for M-Pesa PIN</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  An STK push prompt has been sent to <strong>{phone}</strong> for <strong>KES {totalAmount.toLocaleString()}</strong>.
                </p>
              </div>
              <div className="bg-surface-container rounded-2xl p-4 space-y-2 text-left">
                <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                  <span>Prompt Expiration</span>
                  <span className="font-mono font-bold text-primary text-sm">{stkCountdown}s remaining</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(stkCountdown / 60) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant/80">Please unlock your phone and enter your 4-digit M-Pesa PIN to complete payment.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelStk}
                  className="w-full py-3 rounded-xl border border-outline-variant/50 text-on-surface font-semibold text-xs hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel &amp; Pay via Till Number
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
