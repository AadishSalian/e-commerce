'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CreditCard, MapPin, UserCheck, ShieldCheck, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSavedInfo, setUseSavedInfo] = useState(true);
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  
  // See comment in CartContext regarding useAuth
  let auth: any;
  try {
    auth = useAuth();
  } catch(e) {
    auth = { isLoggedIn: false, user: null };
  }
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
  
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; // Assuming free shipping

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

  const handleAddressSelect = ({ address, city, zip }: { address: string, city: string, zip: string }) => {
    setAddress(address);
    setCity(city);
    setZip(zip);
    setAddressError('');
    setCityError('');
    setZipError('');
  };

  // Generic handle input for address/city/zip if they type it manually
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
      alert(`${method === 'apple' ? 'Apple Pay' : 'Google Pay'} is not supported on this browser/device.`);
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
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: { gateway: 'example', gatewayMerchantId: 'exampleGatewayMerchantId' },
            },
          }],
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
        }
      }
    ];

    const details = {
      total: {
        label: 'Total',
        amount: { currency: 'USD', value: total.toFixed(2) },
      },
      displayItems: cartItems.map(item => ({
        label: item.name,
        amount: { currency: 'USD', value: (item.price * item.quantity).toFixed(2) }
      }))
    };

    try {
      const request = new PaymentRequest(supportedInstruments, details);
      const response = await request.show();
      await response.complete('success');
      
      setIsProcessing(true);
      setTimeout(() => {
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
        // Very basic validation trigger
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
    // Mock processing delay
    setTimeout(() => {
      clearCart();
      router.push('/checkout/success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-12 pb-32">
      <div className="container mx-auto px-4 max-w-4xl flex flex-col lg:flex-row gap-12">
        
        {/* Main Checkout Area */}
        <div className="w-full lg:w-3/5 flex flex-col">
          
          <div className="mb-10">
            <Link href="/cart" className="text-text-muted hover:text-foreground text-sm flex items-center gap-2 transition-colors mb-8">
              Back to Bag
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Checkout
              {isLoggedIn && <span className="text-xs font-semibold px-2.5 py-1 bg-[#8ed500]/10 text-[#8ed500] rounded-full flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> Secure Express</span>}
            </h1>
          </div>

          {!isLoggedIn && (
            <div className="p-4 bg-surface-active rounded-xl border border-border flex justify-between items-center mb-8">
              <div>
                <h3 className="font-semibold text-sm">Already have an account?</h3>
                <p className="text-xs text-text-muted mt-1">Log in for faster checkout with saved details.</p>
              </div>
              <Link href="/login?redirect=/checkout" className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors">
                Log in
              </Link>
            </div>
          )}

          <form onSubmit={handlePayment} className="flex flex-col gap-10">
            
            {/* Express Checkout options */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold mb-2">Express Checkout</h2>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => handleNativePayment('apple')} className="w-full py-4 bg-[#1a1a1a] border border-[#2a2a2a] text-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-[#232323] transition-colors shadow-sm">
                  <Smartphone className="w-5 h-5" /> Apple Pay
                </button>
                <button type="button" onClick={() => handleNativePayment('google')} className="w-full py-4 bg-white border border-gray-200 text-black font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                  Google Pay
                </button>
              </div>
              
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Or continue below</span>
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
                    <input type="email" placeholder="Email Address" required autoComplete="email" className={`w-full bg-surface border ${emailError ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`} value={email} onChange={handleEmailChange} />
                    <AnimatePresence>{emailError && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1 ml-1">{emailError}</motion.p>}</AnimatePresence>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input type="text" placeholder="First Name" required autoComplete="given-name" className={`w-full bg-surface border ${firstNameError ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`} value={firstName} onChange={handleFirstNameChange} />
                      <AnimatePresence>{firstNameError && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1 ml-1">{firstNameError}</motion.p>}</AnimatePresence>
                    </div>
                    <div>
                      <input type="text" placeholder="Last Name" required autoComplete="family-name" className={`w-full bg-surface border ${lastNameError ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`} value={lastName} onChange={handleLastNameChange} />
                      <AnimatePresence>{lastNameError && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1 ml-1">{lastNameError}</motion.p>}</AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <AddressAutocomplete onAddressSelect={handleAddressSelect} error={addressError} />
                    {/* Fallback manual input if they want to edit further */}
                    <input type="text" placeholder="Address line 1" required autoComplete="street-address" className={`w-full bg-surface border ${addressError ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors mt-3`} value={address} onChange={handleAddressChange} />
                    <AnimatePresence>{addressError && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1 ml-1">{addressError}</motion.p>}</AnimatePresence>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <input type="text" placeholder="City" required autoComplete="address-level2" className={`w-full bg-surface border ${cityError ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`} value={city} onChange={handleCityChange} />
                      <AnimatePresence>{cityError && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1 ml-1">{cityError}</motion.p>}</AnimatePresence>
                    </div>
                    <div className="col-span-1">
                      <input type="text" placeholder="Zip" required autoComplete="postal-code" className={`w-full bg-surface border ${zipError ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`} value={zip} onChange={handleZipChange} />
                      <AnimatePresence>{zipError && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs mt-1 ml-1">{zipError}</motion.p>}</AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              
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
                  <input type="text" placeholder="Card Number" required autoComplete="cc-number" className="w-full bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM / YY" required autoComplete="cc-exp" className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
                    <input type="text" placeholder="CVC" required autoComplete="cc-csc" className="col-span-1 bg-surface border border-border text-foreground px-4 py-3 rounded-lg focus:outline-none focus:border-accent transition-colors" />
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

            <button 
              type="submit" 
              disabled={isProcessing}
              className="mt-4 w-full py-4 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center h-[56px] shadow-lg shadow-foreground/10"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                `Place Order ΓÇó $${total.toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-2/5 mt-12 lg:mt-0">
          <div className="bg-surface rounded-xl border border-border p-6 flex flex-col gap-6 sticky top-24">
            <h3 className="text-lg font-medium text-foreground">Order Summary</h3>
            
            {cartItems.map(item => (
              <div key={item.cartId} className="flex gap-4">
                 <div className="w-16 h-16 bg-surface-hover rounded flex-shrink-0 flex items-center justify-center border border-border relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-text-muted text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center z-10">{item.quantity}</span>
                 </div>
                 <div className="flex-grow flex justify-between">
                   <div>
                     <p className="text-sm text-foreground font-medium">{item.name}</p>
                     {item.selectedVariant && <p className="text-xs text-text-muted mt-0.5">{item.selectedVariant}</p>}
                   </div>
                   <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                 </div>
              </div>
            ))}
            
            <div className="w-full h-px bg-border" />
            
            <div className="flex justify-between text-text-muted text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-muted text-sm">
              <span>Shipping</span>
              <span className="text-foreground font-medium">Free</span>
            </div>
            <div className="flex justify-between text-foreground text-lg font-bold pt-4 border-t border-border mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
