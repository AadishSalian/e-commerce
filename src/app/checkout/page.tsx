'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  CreditCard,
  MapPin,
  UserCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore, getItemUnitPrice } from '@/store/useCartStore';
import { FreeShippingProgressBar } from '@/components/cart/FreeShippingProgressBar';
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  isShippingEligible,
  formatCurrency,
} from '@/config/shipping';
import { useAuth } from '@/contexts/AuthContext';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { EMICalculatorModal } from '@/components/emi';
import { formatEmiCurrency } from '@/lib/emi/calculator';
import { SelectedEmiPlan } from '@/lib/emi/types';
import { Product } from '@/lib/mockData';

import Image from 'next/image';

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSavedInfo, setUseSavedInfo] = useState(true);
  const router = useRouter();
  const { cartItems, clearCart, cartEmiPlan, setCartEmiPlan } = useCartStore();

  const auth = useAuth();
  const { isLoggedIn, user } = auth;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [cityError, setCityError] = useState('');
  const [zipError, setZipError] = useState('');

  const subtotal = cartItems.reduce(
    (acc, item) => acc + getItemUnitPrice(item) * item.quantity,
    0
  );
  const isFreeShipping = isShippingEligible(zip) && subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal > 0 ? (isFreeShipping ? 0 : STANDARD_SHIPPING_FEE) : 0;
  const total = subtotal + shipping;

  // Active EMI Plan resolution (Requirement 6: opens with chosen plan preselected)
  const initialPlan = useMemo(() => {
    if (cartEmiPlan) return cartEmiPlan;
    const itemWithPlan = cartItems.find((i) => i.selectedEmiPlan);
    return itemWithPlan ? itemWithPlan.selectedEmiPlan! : null;
  }, [cartEmiPlan, cartItems]);

  const [selectedPlan, setSelectedPlan] = useState<SelectedEmiPlan | null>(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'emi'>(
    initialPlan ? 'emi' : 'card'
  );
  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);

  // Keep selectedPlan in sync if cartEmiPlan changes
  useEffect(() => {
    if (cartEmiPlan) {
      setSelectedPlan(cartEmiPlan);
      setPaymentMethod('emi');
    }
  }, [cartEmiPlan]);

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFirstName(val);
    if (val.trim().length === 0) setFirstNameError('First name is required.');
    else setFirstNameError('');
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLastName(val);
    if (val.trim().length === 0) setLastNameError('Last name is required.');
    else setLastNameError('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !/\S+@\S+\.\S+/.test(val)) setEmailError('Invalid email address.');
    else setEmailError('');
  };

  const handleAddressSelect = ({
    address,
    city,
    zip,
  }: {
    address: string;
    city: string;
    zip: string;
  }) => {
    setAddress(address);
    setCity(city);
    setZip(zip);
    setAddressError('');
    setCityError('');
    setZipError('');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setAddressError(e.target.value ? '' : 'Address is required');
  };
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
    setCityError(e.target.value ? '' : 'City is required');
  };
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZip(e.target.value);
    setZipError(e.target.value ? '' : 'Zip code is required');
  };

  const handleNativePayment = async (method: 'apple' | 'google') => {
    if (!window.PaymentRequest) {
      alert(
        `${method === 'apple' ? 'Apple Pay' : 'Google Pay'} is not supported on this browser/device.`
      );
      return;
    }

    const supportedInstruments = [
      {
        supportedMethods: 'https://google.com/pay',
        data: {
          environment: 'TEST',
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: { merchantName: 'Example Shop' },
          allowedPaymentMethods: [
            {
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['MASTERCARD', 'VISA'],
              },
              tokenizationSpecification: {
                type: 'PAYMENT_GATEWAY',
                parameters: {
                  gateway: 'example',
                  gatewayMerchantId: 'exampleGatewayMerchantId',
                },
              },
            },
          ],
        },
      },
      {
        supportedMethods: 'https://apple.com/apple-pay',
        data: {
          version: 3,
          merchantIdentifier: 'merchant.com.example',
          merchantCapabilities: ['supports3DS'],
          supportedNetworks: ['visa', 'masterCard'],
          countryCode: 'US',
        },
      },
    ];

    const details = {
      total: {
        label: 'Total',
        amount: { currency: 'USD', value: total.toFixed(2) },
      },
      displayItems: cartItems.map((item) => ({
        label: item.name,
        amount: { currency: 'USD', value: (item.price * item.quantity).toFixed(2) },
      })),
    };

    try {
      const request = new PaymentRequest(supportedInstruments, details);
      const response = await request.show();
      await response.complete('success');

      setIsProcessing(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('matte_last_order_emi_plan');
        }
        clearCart();
        router.push('/checkout/success');
      }, 1000);
    } catch (e) {
      console.log('Payment Request aborted or failed', e);
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !useSavedInfo) {
      if (!firstName || !lastName || !email || !address || !city || !zip) {
        if (!firstName) setFirstNameError('Required');
        if (!lastName) setLastNameError('Required');
        if (!email) setEmailError('Required');
        if (!address) setAddressError('Required');
        if (!city) setCityError('Required');
        if (!zip) setZipError('Required');
        return;
      }
    }

    setIsProcessing(true);

    // Save final confirmed EMI plan to session storage for the receipt (Requirement 6)
    if (typeof window !== 'undefined') {
      if (paymentMethod === 'emi' && selectedPlan) {
        sessionStorage.setItem(
          'matte_last_order_emi_plan',
          JSON.stringify(selectedPlan)
        );
      } else {
        sessionStorage.removeItem('matte_last_order_emi_plan');
      }
    }

    // Mock processing delay
    setTimeout(() => {
      clearCart();
      router.push('/checkout/success');
    }, 1500);
  };

  // Synthetic product for whole-checkout EMI adjustments
  const checkoutProduct: Product = useMemo(
    () => ({
      id: 'checkout-total',
      name: 'Checkout Order',
      description: `${cartItems.length} items in order`,
      price: total,
      category: cartItems.some((i) => i.category === 'Home & Furniture')
        ? 'Home & Furniture'
        : 'Tech',
      isNew: false,
      image: cartItems[0]?.image || '',
    }),
    [total, cartItems]
  );

  return (
    <div className="min-h-screen bg-background pt-12 pb-32">
      <div className="container mx-auto px-4 max-w-4xl flex flex-col lg:flex-row gap-12">
        {/* Main Checkout Area */}
        <div className="w-full lg:w-3/5 flex flex-col">
          <div className="mb-10">
            <Link
              href="/cart"
              className="text-text-muted hover:text-foreground text-sm flex items-center gap-2 transition-colors mb-8"
            >
              Back to Bag
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Checkout
              {isLoggedIn && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#8ed500]/10 text-[#8ed500] rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Express
                </span>
              )}
            </h1>
          </div>

          {!isLoggedIn && (
            <div className="p-4 bg-surface-active rounded-xl border border-border flex justify-between items-center mb-8">
              <div>
                <h3 className="font-semibold text-sm">Already have an account?</h3>
                <p className="text-xs text-text-muted mt-1">
                  Log in for faster checkout with saved details.
                </p>
              </div>
              <Link
                href="/login?redirect=/checkout"
                className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors"
              >
                Log in
              </Link>
            </div>
          )}

          <form onSubmit={handlePayment} className="flex flex-col gap-10">
            {/* Express Checkout options */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold mb-2">Express Checkout</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleNativePayment('apple')}
                  className="w-full py-4 bg-[#1a1a1a] border border-[#2a2a2a] text-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-[#232323] transition-colors shadow-sm"
                >
                  <Smartphone className="w-5 h-5" /> Apple Pay
                </button>
                <button
                  type="button"
                  onClick={() => handleNativePayment('google')}
                  className="w-full py-4 bg-white border border-gray-200 text-black font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Google Pay
                </button>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  Or continue below
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>

            {/* Shipping Info */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Shipping Information</h2>

              {isLoggedIn && useSavedInfo ? (
                <div className="p-5 bg-surface rounded-xl border border-border flex items-start gap-4 hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="p-2 bg-surface-active rounded-full shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-sm">Saved Address</p>
                      <span className="text-xs text-accent">Default</span>
                    </div>
                    <p className="text-sm text-text-muted">{user?.name}</p>
                    <p className="text-sm text-text-muted">123 Design Avenue, Apt 4B</p>
                    <p className="text-sm text-text-muted">New York, NY 10001</p>
                    <button
                      type="button"
                      onClick={() => setUseSavedInfo(false)}
                      className="text-sm text-accent hover:text-foreground text-left mt-3 underline underline-offset-4"
                    >
                      Use a different address
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      autoComplete="email"
                      className={`w-full bg-surface border ${
                        emailError
                          ? 'border-red-500/50 focus:border-red-500'
                          : 'border-border focus:border-accent'
                      } text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
                      value={email}
                      onChange={handleEmailChange}
                    />
                    <AnimatePresence>
                      {emailError && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-xs mt-1 ml-1"
                        >
                          {emailError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="First Name"
                        required
                        autoComplete="given-name"
                        className={`w-full bg-surface border ${
                          firstNameError
                            ? 'border-red-500/50 focus:border-red-500'
                            : 'border-border focus:border-accent'
                        } text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
                        value={firstName}
                        onChange={handleFirstNameChange}
                      />
                      <AnimatePresence>
                        {firstNameError && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-500 text-xs mt-1 ml-1"
                          >
                            {firstNameError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Last Name"
                        required
                        autoComplete="family-name"
                        className={`w-full bg-surface border ${
                          lastNameError
                            ? 'border-red-500/50 focus:border-red-500'
                            : 'border-border focus:border-accent'
                        } text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
                        value={lastName}
                        onChange={handleLastNameChange}
                      />
                      <AnimatePresence>
                        {lastNameError && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-500 text-xs mt-1 ml-1"
                          >
                            {lastNameError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <AddressAutocomplete
                      onAddressSelect={handleAddressSelect}
                      error={addressError}
                    />

                    {(!city || !zip) && (
                      <>
                        <div>
                          <input
                            type="text"
                            placeholder="Address line 1"
                            required
                            autoComplete="street-address"
                            className={`w-full bg-surface border ${
                              addressError
                                ? 'border-red-500/50 focus:border-red-500'
                                : 'border-border focus:border-accent'
                            } text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
                            value={address}
                            onChange={handleAddressChange}
                          />
                          <AnimatePresence>
                            {addressError && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-500 text-xs mt-1 ml-1"
                              >
                                {addressError}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="City"
                              required
                              autoComplete="address-level2"
                              className={`w-full bg-surface border ${
                                cityError
                                  ? 'border-red-500/50 focus:border-red-500'
                                  : 'border-border focus:border-accent'
                              } text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
                              value={city}
                              onChange={handleCityChange}
                            />
                            <AnimatePresence>
                              {cityError && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-red-500 text-xs mt-1 ml-1"
                                >
                                  {cityError}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="col-span-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Zip"
                              required
                              autoComplete="postal-code"
                              className={`w-full bg-surface border ${
                                zipError
                                  ? 'border-red-500/50 focus:border-red-500'
                                  : 'border-border focus:border-accent'
                              } text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
                              value={zip}
                              onChange={handleZipChange}
                            />
                            <AnimatePresence>
                              {zipError && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-red-500 text-xs mt-1 ml-1"
                                >
                                  {zipError}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector & Details */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Payment Details</h2>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-active border border-border">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  Pay in Full (Card)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('emi');
                    if (!selectedPlan) {
                      setIsEmiModalOpen(true);
                    }
                  }}
                  className={`py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'emi'
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  <span>Monthly EMI & Pay Later</span>
                  {selectedPlan?.isNoCost && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-bold">
                      0%
                    </span>
                  )}
                </button>
              </div>

              {/* EMI Payment Section */}
              {paymentMethod === 'emi' ? (
                <div className="space-y-4">
                  {selectedPlan ? (
                    <div className="p-5 rounded-2xl bg-surface border border-accent/40 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {selectedPlan.lenderName}
                            </span>
                            {selectedPlan.isNoCost && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-accent/40 bg-accent/10 text-accent font-semibold uppercase">
                                No-Cost
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            {selectedPlan.planType === 'pay_later'
                              ? `Pay Later due on ${selectedPlan.payLaterDueDate}`
                              : `${selectedPlan.tenureMonths} monthly installments • ${selectedPlan.annualInterestRate}% p.a.`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEmiModalOpen(true)}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          Change Plan
                        </button>
                      </div>

                      <div className="pt-2 border-t border-border flex justify-between items-baseline">
                        <span className="text-xs text-text-muted">Monthly Installment</span>
                        <span className="text-xl font-bold text-foreground tabular-nums">
                          {formatEmiCurrency(selectedPlan.monthlyInstallment)}/mo
                        </span>
                      </div>

                      {selectedPlan.processingFee > 0 && (
                        <div className="flex justify-between text-[11px] text-text-muted">
                          <span>Bank Processing Fee</span>
                          <span className="tabular-nums">
                            {formatEmiCurrency(selectedPlan.processingFee)} (+GST)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-surface border border-dashed border-border text-center space-y-2">
                      <p className="text-sm text-text-muted">
                        No EMI plan selected yet for this order.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEmiModalOpen(true)}
                        className="px-4 py-2 rounded-lg bg-surface-hover border border-border text-xs font-semibold hover:border-accent transition-colors"
                      >
                        Choose Bank & Tenure
                      </button>
                    </div>
                  )}

                  {/* Card input for the chosen bank */}
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-text-muted">
                      Enter details for your{' '}
                      <strong className="text-foreground">
                        {selectedPlan?.lenderName || 'eligible bank card'}
                      </strong>
                      :
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Card Number"
                      required
                      autoComplete="cc-number"
                      className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM / YY"
                        required
                        autoComplete="cc-exp"
                        className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="CVC"
                        required
                        autoComplete="cc-csc"
                        className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Card Payment */
                <div>
                  {isLoggedIn && useSavedInfo ? (
                    <div className="p-5 bg-surface rounded-xl border border-border flex items-start gap-4 hover:border-accent/50 transition-colors cursor-pointer">
                      <div className="p-2 bg-surface-active rounded-full shrink-0">
                        <CreditCard className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold text-sm">Saved Payment</p>
                          <span className="text-xs text-accent">Default</span>
                        </div>
                        <p className="text-sm text-text-muted">Visa ending in 4242</p>
                        <p className="text-xs text-text-muted mt-1">Expires 12/28</p>
                        <button
                          type="button"
                          onClick={() => setUseSavedInfo(false)}
                          className="text-sm text-accent hover:text-foreground text-left mt-3 underline underline-offset-4"
                        >
                          Use a different payment method
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Card Number"
                        required
                        autoComplete="cc-number"
                        className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM / YY"
                          required
                          autoComplete="cc-exp"
                          className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="CVC"
                          required
                          autoComplete="cc-csc"
                          className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>

                      {isLoggedIn && !useSavedInfo && (
                        <button
                          type="button"
                          onClick={() => setUseSavedInfo(true)}
                          className="text-sm text-text-muted hover:text-foreground text-left mt-2 underline underline-offset-4"
                        >
                          Back to Express Checkout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="mt-4 w-full py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center h-[56px] shadow-lg shadow-foreground/10"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : paymentMethod === 'emi' && selectedPlan ? (
                `Place Order • ${formatEmiCurrency(
                  selectedPlan.monthlyInstallment
                )}/mo`
              ) : (
                `Place Order • $${total.toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-2/5 mt-12 lg:mt-0">
          <div className="bg-surface rounded-xl border border-border p-6 flex flex-col gap-6 sticky top-24">
            <h3 className="text-lg font-medium text-foreground">Order Summary</h3>
            <div className="rounded-lg border border-border overflow-hidden bg-surface/30">
              <FreeShippingProgressBar
                variant="compact"
                destinationPincode={zip}
                showSuggestions={false}
              />
            </div>

            {cartItems.map((item) => (
              <div key={item.cartId} className="flex gap-4">
                <div className="w-16 h-16 bg-surface-hover rounded flex-shrink-0 flex items-center justify-center border border-border relative overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    width={800}
                    height={800}
                  />
                  <span className="absolute -top-2 -right-2 bg-text-muted text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center z-10">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow flex justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">{item.name}</p>
                    {item.selectedVariant && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.selectedVariant}
                      </p>
                    )}
                    {item.personalization && (
                      <div className="mt-1">
                        <p className="text-xs text-accent font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Personalized: &ldquo;{item.personalization.lines.filter(Boolean).join(' ')}&rdquo;
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {item.personalization.font_label} • Non-returnable • +{item.personalization.lead_time_days}d dispatch
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    ${(getItemUnitPrice(item) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            <div className="w-full h-px bg-border" />

            <div className="flex justify-between text-text-muted text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-muted text-sm">
              <span>Shipping</span>
              <span
                className={
                  isFreeShipping
                    ? 'text-accent font-medium'
                    : 'text-foreground font-medium'
                }
              >
                {isFreeShipping ? 'Free' : formatCurrency(shipping)}
              </span>
            </div>

            <div className="flex justify-between text-foreground text-lg font-bold pt-4 border-t border-border mt-2">
              <span>Total</span>
              <span className="tabular-nums">${total.toFixed(2)}</span>
            </div>

            {/* Requirement 6: Order summary displays "Pay ₹X/month for N months" beneath the total */}
            {paymentMethod === 'emi' && selectedPlan && (
              <div className="pt-3 border-t border-border/50 text-right space-y-0.5">
                <p className="text-sm font-semibold text-accent tabular-nums">
                  Pay {formatEmiCurrency(selectedPlan.monthlyInstallment)}/month for{' '}
                  {selectedPlan.tenureMonths} months
                </p>
                <p className="text-[11px] text-text-muted">
                  via {selectedPlan.lenderName}{' '}
                  {selectedPlan.isNoCost
                    ? '• No-cost EMI'
                    : `• ${selectedPlan.annualInterestRate}% p.a.`}
                </p>
                {selectedPlan.processingFee > 0 && (
                  <p className="text-[10px] text-text-muted">
                    Includes {formatEmiCurrency(selectedPlan.processingFee)} processing fee
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EMI Calculator modal for checkout plan modification */}
      <EMICalculatorModal
        isOpen={isEmiModalOpen}
        onClose={() => setIsEmiModalOpen(false)}
        product={checkoutProduct}
        livePrice={total}
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setCartEmiPlan(plan);
          setPaymentMethod('emi');
        }}
      />
    </div>
  );
}
