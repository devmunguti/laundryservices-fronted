import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderApi } from '../api/orderApi';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve order details if passed via navigation state, or fallback to defaults
  const orderData = location.state || {
    serviceName: 'Standard Wash & Fold',
    details: '1 Bag (approx. 5kg)',
    servicePrice: 1200,
    deliveryOption: 'Student Campus Zone',
    deliveryPrice: 200,
    tillNumber: '555 123',
  };

  const totalAmount = orderData.servicePrice + orderData.deliveryPrice;

  // Form states
  const [phone, setPhone] = useState('');
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('');
  const [stkLoading, setStkLoading] = useState(false);
  const [stkSuccess, setStkSuccess] = useState(false);
  const [stkError, setStkError] = useState('');

  const [copied, setCopied] = useState(false);

  const [transactionCode, setTransactionCode] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Poll backend for PayHero payment status confirmation
  const pollPaymentStatus = (paymentId) => {
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes max polling (150 * 2s)

    const interval = setInterval(async () => {
      attempts++;
      try {
        const { paymentApi } = await import('../api/paymentApi');
        const res = await paymentApi.getPaymentStatus(paymentId);

        if (res.success && res.payment) {
          const currentStatus = (res.payment.status || '').toLowerCase();
          
          if (currentStatus === 'paid') {
            clearInterval(interval);
            setStkLoading(false);
            setStkSuccess(true);
            setPaymentStatusMsg('Payment successful! Your order has been placed.');
            setTimeout(() => {
              navigate('/admin?tab=order-management');
            }, 2000);
          } else if (currentStatus === 'cancelled') {
            clearInterval(interval);
            setStkLoading(false);
            setStkError('M-Pesa payment request was cancelled on your phone.');
          } else if (currentStatus === 'expired') {
            clearInterval(interval);
            setStkLoading(false);
            setStkError('The payment request expired. Please try initiating a new payment.');
          } else if (currentStatus === 'failed') {
            clearInterval(interval);
            setStkLoading(false);
            setStkError(res.payment.failureReason || 'M-Pesa payment could not be completed. Please try again.');
          } else {
            setPaymentStatusMsg('Waiting for M-Pesa confirmation... Please check your phone and complete the payment.');
          }
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStkLoading(false);
        setStkError('Payment confirmation timed out. If you completed payment, please check your order history.');
      }
    }, 2000);
  };

  // Handle STK Push / Checkout Request to backend
  const handleStkPush = async (e) => {
    e.preventDefault();
    setStkError('');
    setStkSuccess(false);
    setPaymentStatusMsg('');

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setStkError('Please enter a valid M-Pesa phone number (e.g. 0712345678)');
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

      // Step 1: Create Order in MongoDB using authoritative service ID
      const orderRes = await orderApi.createOrder({
        items: [
          {
            serviceId: activeServiceId,
            quantity: 1
          }
        ],
        pickupAddress: { street: 'Main Campus Gate A', city: 'Nairobi' },
        deliveryAddress: { street: orderData.deliveryOption || 'Nairobi', city: 'Nairobi' }
      });

      if (!orderRes.success || !orderRes.data?.order?._id) {
        setStkError(orderRes.message || 'Failed to create order.');
        setStkLoading(false);
        return;
      }

      const createdOrderId = orderRes.data.order._id;

      // Step 2: Trigger PayHero STK Push via backend endpoint
      const { paymentApi } = await import('../api/paymentApi');
      const payRes = await paymentApi.checkoutPayment({
        orderId: createdOrderId,
        paymentMethod: 'mpesa',
        phoneNumber: cleanPhone
      });

      if (payRes.success && payRes.data?.paymentId) {
        setPaymentStatusMsg('Check your phone for the M-Pesa prompt and enter your PIN.');
        // Poll for backend confirmation from PayHero callback
        pollPaymentStatus(payRes.data.paymentId);
      } else {
        setStkError(payRes.message || 'Unable to send M-Pesa prompt.');
        setStkLoading(false);
      }
    } catch (err) {
      setStkError(err.response?.data?.message || 'Error processing payment checkout.');
      setStkLoading(false);
    }
  };

  // Handle Manual Confirmation via M-Pesa Till Transaction Code
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setConfirmError('');
    const code = transactionCode.trim().toUpperCase();

    if (code.length < 6) {
      setConfirmError('Please enter a valid M-Pesa transaction code (e.g. QKT1234567)');
      return;
    }

    try {
      setConfirmLoading(true);

      const activeServiceId = orderData.serviceId || orderData._id;
      if (!activeServiceId) {
        setConfirmError('No valid MongoDB service selected. Please return to catalog.');
        setConfirmLoading(false);
        return;
      }

      // Step 1: Create Order in MongoDB if not yet created
      const orderRes = await orderApi.createOrder({
        items: [
          {
            serviceId: activeServiceId,
            quantity: 1
          }
        ],
        pickupAddress: { street: 'Main Campus Gate A', city: 'Nairobi' },
        deliveryAddress: { street: orderData.deliveryOption || 'Nairobi', city: 'Nairobi' }
      });

      if (!orderRes.success || !orderRes.data?.order?._id) {
        setConfirmError(orderRes.message || 'Failed to create order.');
        setConfirmLoading(false);
        return;
      }

      const createdOrderId = orderRes.data.order._id;

      // Step 2: Confirm Manual Till Payment in MongoDB & create Audit Log
      const { paymentApi } = await import('../api/paymentApi');
      const confirmRes = await paymentApi.confirmManualPayment({
        orderId: createdOrderId,
        transactionCode: code
      });

      if (confirmRes.success) {
        setConfirmSuccess(true);
        setTimeout(() => {
          navigate('/admin?tab=order-management');
        }, 1500);
      } else {
        setConfirmError(confirmRes.message || 'Failed to verify transaction code.');
      }
    } catch (err) {
      setConfirmError(err.response?.data?.message || 'Error processing manual payment confirmation.');
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
                  <h2 className="font-headline-md text-headline-md text-on-surface">M-Pesa Payment</h2>
                  <p className="text-xs text-on-surface-variant">Recipient Till: <strong className="text-primary font-mono">{orderData.tillNumber || '8995354'}</strong> ({orderData.providerName || 'Laundry Provider'})</p>
                </div>
              </div>

              {/* Payment Channel Confirmation Badge */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 mb-6 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">verified_user</span>
                  <div>
                    <span className="font-semibold block">Official Platform &amp; Provider Payment Channel</span>
                    <span className="text-[11px] text-emerald-700">Till: {orderData.tillNumber || '8995354'} ({orderData.providerName || 'Provider'})</span>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-1 rounded">Till #{orderData.tillNumber || '8995354'}</span>
              </div>

              <div className="flex flex-col gap-6 relative z-10">
                {/* Option 1: STK Push Prompt */}
                <form onSubmit={handleStkPush} className="flex flex-col gap-3">
                  <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider">
                    Option 1: M-Pesa Express STK Push (Recommended)
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Receive an instant payment prompt directly on your phone for Till #{orderData.tillNumber || '8995354'}. Enter your M-Pesa PIN to authorize.
                  </p>
                  
                  <div className="relative group mb-1">
                    <input
                      className={`w-full bg-[#F1F5F9] rounded-lg px-4 py-4 font-body-md text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-primary ${
                        stkError ? 'ring-1 ring-error bg-error-container/20' : ''
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
                      className={`w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant transition-all flex items-center justify-center ${
                        copied ? 'scale-110 text-secondary' : 'text-primary'
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
                  Manual Confirmation
                </h3>
                <p className="font-body-sm text-on-surface-variant">
                  Enter the M-Pesa transaction code received in your SMS to confirm your order.
                </p>
              </div>

              <form onSubmit={handleConfirmPayment} className="flex flex-col gap-4">
                <div className="relative group">
                  <input
                    className={`w-full bg-[#F1F5F9] rounded-lg px-4 py-4 font-body-md text-on-surface placeholder:text-outline transition-all duration-200 outline-none focus:bg-white focus:ring-1 focus:ring-primary uppercase ${
                      confirmError ? 'ring-1 ring-error bg-error-container/20' : ''
                    }`}
                    id="transaction-code"
                    placeholder="e.g. QKT1234567"
                    type="text"
                    value={transactionCode}
                    onChange={(e) => {
                      setTransactionCode(e.target.value.toUpperCase());
                      if (confirmError) setConfirmError('');
                    }}
                    required
                  />
                  <label
                    className="absolute left-4 -top-2 bg-surface-container-lowest px-1 font-label-md text-[10px] text-primary opacity-0 group-focus-within:opacity-100 transition-opacity"
                    htmlFor="transaction-code"
                  >
                    Transaction Code
                  </label>
                </div>

                {confirmError && (
                  <p className="text-xs text-error font-medium px-1">{confirmError}</p>
                )}

                <button
                  type="submit"
                  disabled={confirmLoading}
                  className={`w-full font-label-md text-body-md py-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 ${
                    confirmSuccess
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
                      Confirm Order
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
