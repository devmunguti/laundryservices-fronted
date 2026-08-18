import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { systemSettingsApi } from '../api/systemSettingsApi';
import { useAuth } from '../hooks/useAuth';
import PickupLocationPicker from '../components/navigation/PickupLocationPicker';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Retrieve order details if passed via navigation state, or fallback to defaults
  const orderData = location.state || {
    serviceName: 'Standard Wash & Fold',
    details: '1 Bag (approx. 5kg)',
    servicePrice: 1200,
    deliveryOption: 'Student Campus Zone',
    deliveryPrice: 200,
    tillNumber: '8995354',
  };

  const totalAmount = orderData.servicePrice + orderData.deliveryPrice;

  // Form states
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderApiResponse, setOrderApiResponse] = useState(null);

  // Client Details Form State
  const [clientName, setClientName] = useState(user?.fullName || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');

  // Campus Pickup & House Location State
  const [campusLocations, setCampusLocations] = useState([
    {
      name: 'Custom House / Apartment Address',
      zone: 'Off-Campus',
      description: 'Provide custom building name and room number',
      instructions: ''
    }
  ]);
  const [selectedCampusLocation, setSelectedCampusLocation] = useState('');
  const [customStreet, setCustomStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');

  // Live GPS Location Pin State
  const [gpsCoords, setGpsCoords] = useState(null);

  // Payment states
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('');
  const [stkLoading, setStkLoading] = useState(false);
  const [stkSuccess, setStkSuccess] = useState(false);
  const [stkError, setStkError] = useState('');

  const [copied, setCopied] = useState(false);

  // Manual confirmation: 'code' = direct input, 'message' = full SMS paste
  const [manualInputMode, setManualInputMode] = useState('code');
  const [transactionCode, setTransactionCode] = useState('');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [extractedCode, setExtractedCode] = useState(null);
  const [extractedHint, setExtractedHint] = useState(null);

  // Fetch live campus locations dynamically from backend settings
  useEffect(() => {
    const fetchCampusLocs = async () => {
      try {
        const res = await systemSettingsApi.getPublicSettings();
        const rawList = (res.success && Array.isArray(res.data?.campusLocations))
          ? res.data.campusLocations
          : [];

        const formatted = rawList.map(loc => ({
          name: loc.name,
          zone: loc.zone || 'Campus Zone',
          description: loc.description || '',
          instructions: loc.instructions || '',
          coordinates: loc.coordinates || null
        }));

        // Always provide custom building / off-campus address option
        formatted.push({
          name: 'Custom House / Apartment Address',
          zone: 'Off-Campus',
          description: 'Provide custom building name and room number',
          instructions: ''
        });

        setCampusLocations(formatted);
        if (formatted.length > 0) {
          setSelectedCampusLocation(prev => {
            const exists = formatted.some(l => l.name === prev);
            return exists ? prev : formatted[0].name;
          });
          if (formatted[0].instructions && !pickupInstructions) {
            setPickupInstructions(formatted[0].instructions);
          }
        }
      } catch (e) {
        console.warn('Failed to load dynamic campus locations:', e);
      }
    };
    fetchCampusLocs();
  }, []);

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Poll backend for PayHero payment status confirmation
  const pollPaymentStatus = (paymentId, fallbackOrderRef) => {
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes max polling (150 * 2s)

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await paymentApi.getPaymentStatus(paymentId);
        setOrderApiResponse(res);
        // Backend wraps the payload under res.data (not res.payment)
        const paymentData = res.data;
        if (res.success && paymentData) {
          const currentStatus = (paymentData.status || '').toLowerCase();

          if (currentStatus === 'paid') {
            clearInterval(interval);
            setStkLoading(false);
            setStkSuccess(true);
            // Extract orderRef from polled response, fallbackOrderRef, or orderApiResponse
            const orderRef = paymentData?.orderRef || fallbackOrderRef || orderApiResponse?.data?.orderRef;
            setPaymentStatusMsg('Payment confirmed! Redirecting to your order tracking page...');
            setTimeout(() => {
              if (orderRef) {
                navigate(`/track-order/${orderRef}`);
              } else {
                navigate('/');
              }
            }, 1200);
          } else if (currentStatus === 'cancelled') {
            clearInterval(interval);
            setStkLoading(false);
            setStkError('M-Pesa payment request was cancelled on your phone.');
            setPaymentStatusMsg('');
          } else if (currentStatus === 'expired') {
            clearInterval(interval);
            setStkLoading(false);
            setStkError('The payment request expired. Please try initiating a new payment.');
            setPaymentStatusMsg('');
          } else if (currentStatus === 'failed') {
            clearInterval(interval);
            setStkLoading(false);
            setStkError(paymentData.failureReason || 'M-Pesa payment could not be completed. Please try again.');
            setPaymentStatusMsg('');
          } else {
            setPaymentStatusMsg('Waiting for M-Pesa confirmation... Please check your phone and enter your PIN.');
          }
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStkLoading(false);
        setStkError('Payment confirmation timed out. If you completed payment, please check your order history or track using your M-Pesa code.');
      }
    }, 2000);
  };

  // Helper to ensure order exists in MongoDB (reuses activeOrder if already created in session)
  const getOrCreateOrder = async (activeServiceId) => {
    if (activeOrder?._id) {
      return activeOrder;
    }

    const isCustom =
      selectedCampusLocation === 'Custom House / Apartment Address' ||
      selectedCampusLocation === 'Not on the list (Custom Location)' ||
      selectedCampusLocation === 'CUSTOM_LOCATION' ||
      !selectedCampusLocation;
    const effectiveStreet = isCustom ? (customStreet || 'Nairobi') : selectedCampusLocation;

    const orderRes = await orderApi.createOrder({
      items: [
        {
          serviceId: activeServiceId,
          quantity: 1
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
        campusLocation: selectedCampusLocation,
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

  // Handle STK Push / Checkout Request to backend
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

    if (!clientName.trim()) {
      setStkError('Please enter your full name so the cleaner can identify your order.');
      return;
    }

    try {
      setStkLoading(true);

      const activeServiceId = orderData.serviceId || orderData._id;
      if (!activeServiceId) {
        setStkError('No valid MongoDB service selected. Please return to the services catalog.');
        setStkLoading(false);
        return;
      }

      // Step 1: Get existing or create Order in MongoDB
      const currentOrder = await getOrCreateOrder(activeServiceId);
      const createdOrderId = currentOrder._id;
      const createdOrderRef = currentOrder.orderRef;

      // Step 2: Trigger PayHero STK Push via backend endpoint
      const payRes = await paymentApi.checkoutPayment({
        orderId: createdOrderId,
        paymentMethod: 'mpesa',
        phoneNumber: cleanPhone
      });

      if (payRes.success && payRes.data?.paymentId) {
        setPaymentStatusMsg('Check your phone for the M-Pesa prompt and enter your PIN.');
        // Poll for backend confirmation from PayHero callback and redirect to track order
        pollPaymentStatus(payRes.data.paymentId, createdOrderRef);
      } else {
        setStkError(payRes.message || 'Unable to send M-Pesa prompt.');
        setStkLoading(false);
      }
    } catch (err) {
      setStkError(err.response?.data?.message || err.message || 'Error processing payment checkout.');
      setStkLoading(false);
    }
  };

  // Handle Manual Confirmation — routes to verifyManualPayment (supports both modes)
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setConfirmError('');
    setExtractedCode(null);
    setExtractedHint(null);

    const isMessageMode = manualInputMode === 'message';
    const code = isMessageMode ? null : transactionCode.trim().toUpperCase();
    const message = isMessageMode ? mpesaMessage.trim() : null;

    if (!isMessageMode && code.length < 6) {
      setConfirmError('Please enter a valid M-Pesa transaction code (e.g. QKT1234567)');
      return;
    }
    if (isMessageMode && (!message || message.length < 20)) {
      setConfirmError('Please paste your complete M-Pesa confirmation SMS message.');
      return;
    }

    try {
      setConfirmLoading(true);

      const activeServiceId = orderData.serviceId || orderData._id;
      if (!activeServiceId) {
        setConfirmError('No valid service selected. Please return to catalog.');
        setConfirmLoading(false);
        return;
      }

      // Step 1: Get existing or create Order in MongoDB
      const currentOrder = await getOrCreateOrder(activeServiceId);
      const createdOrderId = currentOrder._id;
      const createdOrderRef = currentOrder.orderRef;

      // Step 2: Verify M-Pesa payment via backend verification service
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
        // Map backend state enum to user-friendly messages
        const stateMessages = {
          EXTRACTION_FAILED: `Could not extract a transaction code from your message. ${verifyRes.hint || 'Please check that you pasted the complete M-Pesa SMS.'}`,
          INVALID_CODE_FORMAT: `"${verifyRes.extractedCode || code}" is not a valid M-Pesa receipt code. Please check and try again.`,
          AMOUNT_MISMATCH: `Payment amount mismatch. Expected KES ${verifyRes.expected}, message shows KES ${verifyRes.received}. Please confirm you used the correct payment.`,
          ALREADY_USED: 'This M-Pesa transaction code has already been used for another order.',
          FORBIDDEN: 'You are not authorized to confirm this order.',
        };
        setConfirmError(stateMessages[verifyRes.state] || verifyRes.message || 'Failed to verify transaction code.');
        if (verifyRes.state === 'EXTRACTION_FAILED' && verifyRes.hint) {
          setExtractedHint(verifyRes.hint);
        }
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
      const state = respData?.state;
      const stateMessages = {
        EXTRACTION_FAILED: respData?.hint || 'Could not extract a code from your message. Please paste the complete M-Pesa SMS.',
        AMOUNT_MISMATCH: `Amount mismatch: expected KES ${respData?.expected}, message shows KES ${respData?.received}.`,
        ALREADY_USED: 'This M-Pesa transaction code has already been used for another order.',
      };
      setConfirmError(stateMessages[state] || respData?.message || err.message || 'Error processing payment confirmation.');
    } finally {
      setConfirmLoading(false);
    }
  };


  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 glass bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-16 px-container-padding-mobile flex items-center gap-unit">
          <button
            type="button"
            className="w-11 h-11 -ml-2 flex items-center justify-center text-on-surface hover:bg-surface-container rounded-full transition-colors"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-on-surface truncate">
            Service Details & Checkout
          </h1>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-safe">
          <div className="px-container-padding-mobile py-bento-gap flex flex-col gap-bento-gap max-w-[600px] mx-auto w-full">

            {/* Order Summary Bento */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-md text-headline-md text-on-surface">Order Summary</h2>
                <span className="material-symbols-outlined text-primary">receipt_long</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center py-2 border-b border-surface-variant">
                  <div className="flex flex-col">
                    <span className="font-body-md text-on-surface font-medium">{orderData.serviceName}</span>
                    <span className="font-body-sm text-outline">{orderData.details}</span>
                  </div>
                  <span className="font-body-md text-on-surface font-semibold">
                    KES {orderData.servicePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-variant">
                  <div className="flex flex-col">
                    <span className="font-body-md text-on-surface font-medium">Pickup &amp; Delivery</span>
                    <span className="font-body-sm text-outline">{orderData.deliveryOption}</span>
                  </div>
                  <span className="font-body-md text-on-surface font-semibold">
                    KES {orderData.deliveryPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2">
                  <span className="font-headline-md text-body-lg text-on-surface">Total Amount</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    KES {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            {/* 1. Client Contact Details & House Pickup Location Section */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">person_pin_circle</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Your Details &amp; Pickup Point</h2>
                    <p className="text-xs text-on-surface-variant">Helps the cleaner find your room/hostel quickly.</p>
                  </div>
                </div>
                <span className="bg-primary-container text-on-primary-container text-[11px] font-semibold px-2.5 py-1 rounded-full">Step 1 of 2</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Full Name & Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                      <span>Full Name</span>
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Brian Otieno"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-[#F1F5F9] rounded-lg px-3.5 py-3 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                      <span>Phone Number (Calls/WhatsApp)</span>
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value);
                        if (!phone) setPhone(e.target.value);
                      }}
                      className="w-full bg-[#F1F5F9] rounded-lg px-3.5 py-3 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">
                    Email Address (For receipts &amp; live order tracking)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. brian@university.ac.ke"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#F1F5F9] rounded-lg px-3.5 py-3 text-sm text-on-surface border border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                {/* Pickup Location, Campus Hubs, OSM Place Search & Live Map */}
                <div className="pt-2 border-t border-surface-variant/40">
                  <PickupLocationPicker
                    campusLocations={campusLocations}
                    selectedCampusLocation={selectedCampusLocation}
                    onSelectCampusLocation={setSelectedCampusLocation}
                    customStreet={customStreet}
                    onChangeCustomStreet={setCustomStreet}
                    houseNumber={houseNumber}
                    onChangeHouseNumber={setHouseNumber}
                    pickupInstructions={pickupInstructions}
                    onChangePickupInstructions={setPickupInstructions}
                    gpsCoords={gpsCoords}
                    onGpsCoordsChange={setGpsCoords}
                  />
                </div>
              </div>
            </section>

            {/* M-Pesa Payment Instructions Bento */}
            <section className="bg-surface-container-highest rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-secondary font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    phone_iphone
                  </span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">M-Pesa Payment (Step 2 of 2)</h2>
                  <p className="text-xs text-on-surface-variant">Recipient Till: <strong className="text-primary font-mono">{orderData.tillNumber || '8995354'}</strong> ({orderData.providerName || 'Laundry Provider'})</p>
                </div>
              </div>

              {/* Payment Channel Confirmation Badge & Transparency Mode */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3.5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">verified_user</span>
                  <div>
                    <span className="font-semibold block">
                      {orderData.tillNumber && orderData.tillNumber !== '8995354'
                        ? 'Direct Provider Payment (0% Platform Fee)'
                        : 'Official Aura Platform Escrow Channel'}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {orderData.tillNumber && orderData.tillNumber !== '8995354'
                        ? `Funds go 100% directly to ${orderData.providerName || 'Provider'}`
                        : 'Protected payment with instant cleaner notification'}
                    </span>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded text-center">Till #{orderData.tillNumber || '8995354'}</span>
              </div>

              <div className="flex flex-col gap-6 relative z-10">
                {/* Option 1: STK Push Prompt */}
                <form onSubmit={handleStkPush} className="flex flex-col gap-3">
                  <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider">
                    Option 1: M-Pesa Express STK Push (Recommended)
                    {JSON.stringify(orderApiResponse)}
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Receive an instant payment prompt directly on your phone for Till #{orderData.tillNumber || '8995354'}. Enter your M-Pesa PIN to authorize.
                  </p>

                  <div className="relative group mb-1">
                    <input
                      className={`w-full bg-[#F1F5F9] rounded-lg px-4 py-4 font-body-md text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-primary ${stkError ? 'ring-1 ring-error bg-error-container/20' : ''
                        }`}
                      id="mpesa-phone"
                      placeholder="e.g. 0712345678"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (stkError) setStkError('');
                      }}
                      required
                    />
                    <label
                      className="absolute left-4 -top-2 bg-surface-container-highest px-1 font-label-md text-[10px] text-primary opacity-0 group-focus-within:opacity-100 transition-opacity"
                      htmlFor="mpesa-phone"
                    >
                      M-Pesa Phone Number
                    </label>
                  </div>

                  {stkError && (
                    <p className="text-xs text-error font-medium px-1">{stkError}</p>
                  )}

                  {paymentStatusMsg && (
                    <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-lg p-3 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-blue-600 animate-spin">sync</span>
                      <span>{paymentStatusMsg}</span>
                    </div>
                  )}

                  {stkSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-3 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                      <span>STK push prompt sent to <strong>{phone}</strong>. Please check your phone and enter your M-Pesa PIN.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={stkLoading}
                    className="w-full bg-primary text-on-primary font-semibold py-4 rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {stkLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                        Sending STK Push...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send_to_mobile</span>
                        Send STK Push Request
                      </>
                    )}
                  </button>
                </form>

                <div className="h-px bg-surface-variant/50 w-full"></div>

                {/* Option 2: Manual Till Payment */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-label-md text-label-md text-outline uppercase tracking-wider">
                    {orderData.hasChannelConfigured !== false ? 'Option 2: Manual Till Payment' : 'Manual Till Payment (Required)'}
                  </h3>
                  <div className="bg-surface-container-lowest rounded-lg p-4 flex justify-between items-center border border-surface-variant/50">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-outline mb-1 uppercase">
                        M-Pesa Buy Goods Till Number
                      </span>
                      <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold tracking-widest">
                        {orderData.tillNumber || '8995354'}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="Copy Till Number"
                      className={`w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant transition-all flex items-center justify-center ${copied ? 'scale-110 text-secondary' : 'text-primary'
                        }`}
                      onClick={() => copyToClipboard(orderData.tillNumber || '8995354')}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    Pay KES <strong>{totalAmount.toLocaleString()}</strong> to Buy Goods Till <strong>{orderData.tillNumber || '8995354'}</strong>, then enter the M-Pesa transaction code below.
                  </p>
                </div>
              </div>
            </section>

            {/* Confirmation Bento */}
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col gap-2 mb-4">
                <h3 className="font-headline-md text-body-lg text-on-surface font-semibold">
                  Confirm Your Payment
                </h3>
                <p className="font-body-sm text-on-surface-variant">
                  After paying, confirm using your M-Pesa code or paste the full SMS.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-surface-container rounded-lg p-1 gap-1 mb-4">
                <button
                  type="button"
                  id="manual-mode-code"
                  onClick={() => { setManualInputMode('code'); setConfirmError(''); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${manualInputMode === 'code'
                      ? 'bg-surface-container-lowest shadow-sm text-primary'
                      : 'text-outline hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-sm">pin</span>
                  Enter Code
                </button>
                <button
                  type="button"
                  id="manual-mode-message"
                  onClick={() => { setManualInputMode('message'); setConfirmError(''); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${manualInputMode === 'message'
                      ? 'bg-surface-container-lowest shadow-sm text-primary'
                      : 'text-outline hover:text-on-surface'
                    }`}
                >
                  <span className="material-symbols-outlined text-sm">sms</span>
                  Paste SMS
                </button>
              </div>

              <form onSubmit={handleConfirmPayment} className="flex flex-col gap-4">

                {manualInputMode === 'code' ? (
                  <div className="relative group">
                    <input
                      className={`w-full bg-[#F1F5F9] rounded-lg px-4 py-4 font-body-md text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-primary uppercase font-mono tracking-widest ${confirmError ? 'ring-1 ring-error bg-error-container/20' : ''}`}
                      id="transaction-code"
                      placeholder="e.g. QKT1234567"
                      type="text"
                      value={transactionCode}
                      onChange={(e) => {
                        setTransactionCode(e.target.value.toUpperCase());
                        if (confirmError) setConfirmError('');
                      }}
                      maxLength={12}
                      autoComplete="off"
                    />
                    <label
                      className="absolute left-4 -top-2 bg-surface-container-lowest px-1 font-label-md text-[10px] text-primary opacity-0 group-focus-within:opacity-100 transition-opacity"
                      htmlFor="transaction-code"
                    >
                      M-Pesa Transaction Code
                    </label>
                    <p className="text-xs text-outline mt-1 px-1">
                      The 10-character code from your M-Pesa confirmation SMS (e.g. QKT1234567)
                    </p>
                  </div>
                ) : (
                  <div className="relative group">
                    <textarea
                      className={`w-full bg-[#F1F5F9] rounded-lg px-4 py-3 font-body-sm text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-primary resize-none ${confirmError ? 'ring-1 ring-error bg-error-container/20' : ''}`}
                      id="mpesa-message"
                      rows={4}
                      placeholder={"Paste your full M-Pesa SMS here...\n\nExample:\nQKT1234567 Confirmed.\nKsh1,200.00 sent to Laundry\non 15/8/26 at 2:30 PM"}
                      value={mpesaMessage}
                      onChange={(e) => {
                        setMpesaMessage(e.target.value);
                        if (confirmError) setConfirmError('');
                      }}
                    />
                    <label
                      className="absolute left-4 -top-2 bg-surface-container-lowest px-1 font-label-md text-[10px] text-primary opacity-0 group-focus-within:opacity-100 transition-opacity"
                      htmlFor="mpesa-message"
                    >
                      Full M-Pesa Confirmation SMS
                    </label>
                    <p className="text-xs text-outline mt-1 px-1">
                      Copy and paste the complete M-Pesa SMS message exactly as received — we'll extract your transaction code automatically.
                    </p>
                  </div>
                )}

                {confirmError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                    <span className="font-semibold">Error: </span>{confirmError}
                  </div>
                )}

                {confirmSuccess && extractedCode && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                    <span>Payment confirmed! Code: <strong className="font-mono">{extractedCode}</strong>. Redirecting to your order...</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="confirm-payment-btn"
                  disabled={confirmLoading || confirmSuccess}
                  className={`w-full font-label-md text-body-md py-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 ${confirmSuccess
                    ? 'bg-secondary text-white'
                    : 'bg-primary text-on-primary hover:bg-primary/90 hover:shadow-md active:scale-[0.98]'
                    } disabled:opacity-80 disabled:pointer-events-none`}
                >
                  {confirmLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      Verifying...
                    </>
                  ) : confirmSuccess ? (
                    <>
                      Payment Confirmed
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                    </>
                  ) : (
                    <>
                      {manualInputMode === 'message' ? 'Extract & Confirm' : 'Confirm Payment'}
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    </>
                  )}
                </button>
              </form>
            </section>


            {/* Trust Indicator */}
            <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
              <span className="material-symbols-outlined text-outline text-sm">lock</span>
              <span className="font-label-md text-label-md text-outline">Secure Payment Verification</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
