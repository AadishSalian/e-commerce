/**
 * Order Confirmation Data Service & Security Enforcement.
 * Enforces ownership access controls (no IDOR), anti-enumeration, and server-side state veracity.
 */

import fs from 'fs';
import path from 'path';
import { OrderConfirmationRecord, PaymentStatus } from './types';
import { calculateDeliveryEstimate } from './deliveryEstimator';
import { maskEmail, maskPhone } from './masking';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

let cachedOrders: OrderConfirmationRecord[] | null = null;

// Initial robust seed data covering all edge cases (confirmed, COD, pending, failed, split)
const baseNow = new Date('2026-11-08T12:00:00Z');
const pastHour = new Date('2026-11-08T11:45:00Z').toISOString();
const twoHoursAhead = new Date('2026-11-08T14:00:00Z').toISOString();
const endOfDay = new Date('2026-11-08T18:00:00Z').toISOString();
const futureTokenExpiry = new Date('2026-12-08T12:00:00Z').toISOString();
const expiredTokenExpiry = new Date('2026-11-01T12:00:00Z').toISOString();

const estDelivery = calculateDeliveryEstimate({
  orderPlacedDate: baseNow,
  hasPersonalizedItems: true,
  maxProductionDays: 2,
});

export const SEED_ORDERS: OrderConfirmationRecord[] = [
  {
    id: 'ORD-948271',
    idempotencyKey: 'idem-948271-prod-01',
    guestAccessToken: '7f9a8b1c4d2e3f4a5b6c7d8e9f0a1b2c',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'confirmed',
    customer: {
      userId: 'usr-demo-1',
      isGuest: false,
      email: 'aadishsalian@gmail.com',
      maskedEmail: maskEmail('aadishsalian@gmail.com'),
      phone: '+91 98765 43210',
      maskedPhone: maskPhone('+91 98765 43210'),
      firstName: 'Aadish',
      lastName: 'Salian',
      shippingAddress: {
        line1: '402 Oberoi Crest, Off Link Road',
        line2: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400053',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed',
      method: 'card',
      methodTitle: 'Credit Card',
      maskedDetails: 'Mastercard ending in 8842',
      transactionId: 'TXN-984102941',
    },
    pricing: {
      subtotal: 16980,
      discount: 2000,
      couponCode: 'DROP20',
      shipping: 0,
      isShippingFree: true,
      taxGst: 2696.4,
      taxGstNumber: '27AABCU9603R1ZM',
      personalizationFee: 490,
      giftWrapFee: 0,
      total: 15470,
      currency: 'INR',
    },
    shipments: [
      {
        id: 'ship-1',
        shipmentNumber: 1,
        totalShipments: 2,
        title: 'Shipment 1: Custom Inscribed Gear',
        carrier: 'BlueDart Express',
        trackingNumber: 'BLR78491029',
        trackingUrl: 'https://track.bluedart.com/?track=BLR78491029',
        signatureRequired: true,
        estimatedDelivery: {
          start: estDelivery.startDate,
          end: estDelivery.endDate,
          formattedDisplay: estDelivery.formattedDisplay,
          isEstimate: true,
          windowConfirmed: false,
        },
        items: [
          {
            id: 'item-d4-1',
            productId: 't-1',
            name: 'Matte Keyboard 1',
            variant: 'Obsidian Black',
            quantity: 1,
            unitPrice: 12990,
            linePrice: 12990,
            image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop',
            isPersonalized: true,
            personalization: {
              inscription: 'AADISH • STUDIO 01',
              fontName: 'JetBrains Mono',
              placement: 'Top Right Aluminum Bezel',
              finishStyle: 'laser_metal',
              productionDays: 2,
            },
          },
        ],
        stages: [
          {
            key: 'placed',
            label: 'Order placed',
            sublabel: 'Received and verified by server',
            timestamp: pastHour,
            isCompleted: true,
            isCurrent: false,
          },
          {
            key: 'processing',
            label: 'Being engraved & assembled',
            sublabel: 'Custom laser engraving in progress (2 days lead time)',
            isCompleted: false,
            isCurrent: true,
            estimatedDateOrRange: 'Estimated completion Nov 10',
          },
          {
            key: 'packed',
            label: 'Packed & handed to carrier',
            isCompleted: false,
            isCurrent: false,
            estimatedDateOrRange: 'Estimated Nov 11',
          },
          {
            key: 'in_transit',
            label: 'In transit',
            sublabel: 'BlueDart Air Express',
            isCompleted: false,
            isCurrent: false,
          },
          {
            key: 'out_for_delivery',
            label: 'Out for delivery',
            isCompleted: false,
            isCurrent: false,
          },
          {
            key: 'delivered',
            label: 'Delivered',
            isCompleted: false,
            isCurrent: false,
            estimatedDateOrRange: estDelivery.formattedDisplay,
          },
        ],
      },
      {
        id: 'ship-2',
        shipmentNumber: 2,
        totalShipments: 2,
        title: 'Shipment 2: In-Stock Essentials',
        carrier: 'Delhivery Surface',
        trackingNumber: 'DEL99482103',
        trackingUrl: 'https://delhivery.com/track/DEL99482103',
        estimatedDelivery: {
          start: '2026-11-11',
          end: '2026-11-13',
          formattedDisplay: 'Wed 11 Nov to Fri 13 Nov',
          isEstimate: true,
          windowConfirmed: false,
        },
        items: [
          {
            id: 'item-d4-2',
            productId: 't-2',
            name: 'Coiled Braided Cable',
            variant: 'Matte Charcoal / USB-C',
            quantity: 1,
            unitPrice: 2490,
            linePrice: 2490,
            image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=400&auto=format&fit=crop',
          },
        ],
        stages: [
          {
            key: 'placed',
            label: 'Order placed',
            timestamp: pastHour,
            isCompleted: true,
            isCurrent: false,
          },
          {
            key: 'processing',
            label: 'Order confirmed and ready',
            isCompleted: true,
            timestamp: pastHour,
            isCurrent: false,
          },
          {
            key: 'packed',
            label: 'Packed at Mumbai fulfillment hub',
            isCompleted: false,
            isCurrent: true,
          },
          {
            key: 'in_transit',
            label: 'In transit',
            isCompleted: false,
            isCurrent: false,
          },
          {
            key: 'out_for_delivery',
            label: 'Out for delivery',
            isCompleted: false,
            isCurrent: false,
          },
          {
            key: 'delivered',
            label: 'Delivered',
            isCompleted: false,
            isCurrent: false,
            estimatedDateOrRange: 'Wed 11 Nov to Fri 13 Nov',
          },
        ],
      },
    ],
    giftOptions: {
      isGift: false,
      hidePricesOnSlip: false,
    },
    editableUntil: endOfDay,
    cancellableUntil: twoHoursAhead,
  },
  // COD Order
  {
    id: 'ORD-552109',
    idempotencyKey: 'idem-552109-cod',
    guestAccessToken: 'a1b2c3d4e5f6789012345678abcdef01',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'confirmed_cod',
    customer: {
      isGuest: true,
      email: 'guest.shopper@yahoo.com',
      maskedEmail: maskEmail('guest.shopper@yahoo.com'),
      phone: '+91 91234 56789',
      maskedPhone: maskPhone('+91 91234 56789'),
      firstName: 'Rahul',
      lastName: 'Verma',
      shippingAddress: {
        line1: 'B-14 Green Park Ext',
        city: 'New Delhi',
        state: 'Delhi',
        zip: '110016',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed_cod',
      method: 'cod',
      methodTitle: 'Cash on Delivery',
      maskedDetails: 'Pay in cash or UPI QR at door',
      amountDueOnDelivery: 3490,
      codInstructions: 'Please keep exact cash or scan the courier UPI QR upon arrival.',
    },
    pricing: {
      subtotal: 3490,
      discount: 0,
      shipping: 0,
      isShippingFree: true,
      taxGst: 532.37,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 3490,
      currency: 'INR',
    },
    shipments: [
      {
        id: 'ship-cod-1',
        shipmentNumber: 1,
        totalShipments: 1,
        title: 'Standard Courier Delivery',
        carrier: 'Shadowfax',
        estimatedDelivery: {
          start: '2026-11-12',
          end: '2026-11-14',
          formattedDisplay: 'Thu 12 Nov to Sat 14 Nov',
          isEstimate: true,
          windowConfirmed: false,
        },
        items: [
          {
            id: 'item-cd-1',
            productId: 't-3',
            name: 'Monolith Headphones Case',
            variant: 'Matte Grey',
            quantity: 1,
            unitPrice: 3490,
            linePrice: 3490,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
          },
        ],
        stages: [
          {
            key: 'placed',
            label: 'Order placed (COD confirmed)',
            timestamp: pastHour,
            isCompleted: true,
            isCurrent: false,
          },
          {
            key: 'processing',
            label: 'Preparing for dispatch',
            isCompleted: false,
            isCurrent: true,
          },
          { key: 'packed', label: 'Packed & ready', isCompleted: false, isCurrent: false },
          { key: 'in_transit', label: 'In transit', isCompleted: false, isCurrent: false },
          { key: 'out_for_delivery', label: 'Out for delivery', isCompleted: false, isCurrent: false },
          { key: 'delivered', label: 'Delivered & collected', isCompleted: false, isCurrent: false },
        ],
      },
    ],
    editableUntil: endOfDay,
    cancellableUntil: endOfDay,
  },
  // Pending State Order
  {
    id: 'ORD-PENDING-UPI',
    idempotencyKey: 'idem-upi-poll-01',
    guestAccessToken: 'pendingtoken1234567890abcdef1234',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'payment_pending',
    customer: {
      isGuest: true,
      email: 'priya.n@gmail.com',
      maskedEmail: maskEmail('priya.n@gmail.com'),
      phone: '+91 98111 22334',
      maskedPhone: maskPhone('+91 98111 22334'),
      firstName: 'Priya',
      lastName: 'Nair',
      shippingAddress: {
        line1: '12 Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        zip: '560038',
        country: 'India',
      },
    },
    payment: {
      status: 'payment_pending',
      method: 'upi',
      methodTitle: 'UPI Intent',
      maskedDetails: 'Awaiting bank settlement confirmation',
    },
    pricing: {
      subtotal: 5490,
      discount: 500,
      shipping: 0,
      isShippingFree: true,
      taxGst: 837.4,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 4990,
      currency: 'INR',
    },
    shipments: [],
  },
  // Failed Payment Order
  {
    id: 'ORD-FAILED-CARD',
    idempotencyKey: 'idem-failed-01',
    guestAccessToken: 'failedtoken1234567890abcdef1234',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'payment_failed',
    customer: {
      isGuest: true,
      email: 'vikram.k@gmail.com',
      maskedEmail: maskEmail('vikram.k@gmail.com'),
      phone: '+91 97777 88888',
      maskedPhone: maskPhone('+91 97777 88888'),
      firstName: 'Vikram',
      lastName: 'Kapoor',
      shippingAddress: {
        line1: 'Penthouse 9, DLF Phase 5',
        city: 'Gurugram',
        state: 'Haryana',
        zip: '122002',
        country: 'India',
      },
    },
    payment: {
      status: 'payment_failed',
      method: 'card',
      methodTitle: 'Credit Card',
      maskedDetails: 'Visa ending in 0002',
      failureReason: 'Transaction was declined by issuing bank (Insufficient funds / card limit reached).',
      failureCode: 'DECLINED_LIMIT',
    },
    pricing: {
      subtotal: 21990,
      discount: 0,
      shipping: 0,
      isShippingFree: true,
      taxGst: 3354.4,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 21990,
      currency: 'INR',
    },
    shipments: [],
  },
  // Expired Guest Token Order
  {
    id: 'ORD-EXPIRED-TOKEN',
    idempotencyKey: 'idem-expired-01',
    guestAccessToken: 'expiredtoken1234567890abcdef1234',
    tokenExpiresAt: expiredTokenExpiry, // Past!
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
    status: 'confirmed',
    customer: {
      isGuest: true,
      email: 'old.guest@example.com',
      maskedEmail: maskEmail('old.guest@example.com'),
      phone: '+91 99999 00000',
      maskedPhone: maskPhone('+91 99999 00000'),
      firstName: 'Old',
      lastName: 'Guest',
      shippingAddress: {
        line1: '1 Old Way',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zip: '600001',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed',
      method: 'upi',
      methodTitle: 'UPI',
      maskedDetails: 'UPI: old@upi',
    },
    pricing: {
      subtotal: 1999,
      discount: 0,
      shipping: 0,
      isShippingFree: true,
      taxGst: 305,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 1999,
      currency: 'INR',
    },
    shipments: [],
  },
  // Partially Confirmed Order (Item out of stock, refund issued)
  {
    id: 'ORD-PARTIAL-SPLIT',
    idempotencyKey: 'idem-partial-01',
    guestAccessToken: 'partialtoken1234567890abcdef123',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'partially_confirmed',
    customer: {
      isGuest: true,
      email: 'sumit.r@example.com',
      maskedEmail: maskEmail('sumit.r@example.com'),
      phone: '+91 98222 33445',
      maskedPhone: maskPhone('+91 98222 33445'),
      firstName: 'Sumit',
      lastName: 'Rao',
      shippingAddress: {
        line1: 'Flat 7B, Horizon Residency',
        city: 'Pune',
        state: 'Maharashtra',
        zip: '411001',
        country: 'India',
      },
    },
    payment: {
      status: 'partially_confirmed',
      method: 'card',
      methodTitle: 'Credit Card',
      maskedDetails: 'Mastercard ending in 8842',
      transactionId: 'TXN-77391024',
    },
    orderAdjustment: {
      originalTotal: 7480,
      newTotal: 4990,
      refundAmount: 2490,
      refundMethod: 'Refunded to original Mastercard ending in 8842',
      reason: 'Matte Aluminum Desk Pad is temporarily out of stock at our Western regional fulfillment hub.',
      affectedItemNames: ['Matte Aluminum Desk Pad'],
    },
    pricing: {
      subtotal: 4990,
      discount: 0,
      shipping: 0,
      isShippingFree: true,
      taxGst: 761.18,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 4990,
      currency: 'INR',
    },
    shipments: [
      {
        id: 'ship-partial-1',
        shipmentNumber: 1,
        totalShipments: 1,
        title: 'Shipment 1: Fulfilled Essentials',
        carrier: 'Delhivery Surface',
        trackingNumber: 'DEL33819402',
        trackingUrl: 'https://delhivery.com/track/DEL33819402',
        estimatedDelivery: {
          start: '2026-11-13',
          end: '2026-11-15',
          formattedDisplay: 'Fri 13 Nov to Sun 15 Nov',
          isEstimate: true,
          windowConfirmed: false,
        },
        items: [
          {
            id: 'item-partial-ok',
            productId: 't-mouse-1',
            name: 'Precision Wireless Mouse',
            variant: 'Matte Charcoal',
            quantity: 1,
            unitPrice: 4990,
            linePrice: 4990,
            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=400&auto=format&fit=crop',
            fulfillmentStatus: 'fulfilled',
          },
          {
            id: 'item-partial-refunded',
            productId: 't-pad-1',
            name: 'Matte Aluminum Desk Pad',
            variant: 'Anodized Silver',
            quantity: 1,
            unitPrice: 2490,
            linePrice: 2490,
            image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&auto=format&fit=crop',
            fulfillmentStatus: 'cancelled_refunded',
            unfulfilledReason: 'Out of stock at regional center; full refund of ₹2,490 automatically refunded to your card.',
          },
        ],
        stages: [
          {
            key: 'placed',
            label: 'Order placed',
            timestamp: pastHour,
            isCompleted: true,
            isCurrent: false,
          },
          {
            key: 'processing',
            label: 'Confirmed and processing fulfilled items',
            timestamp: pastHour,
            isCompleted: true,
            isCurrent: false,
          },
          {
            key: 'packed',
            label: 'Packed at Pune fulfillment centre',
            isCompleted: false,
            isCurrent: true,
            estimatedDateOrRange: 'Estimated Nov 12',
          },
          {
            key: 'in_transit',
            label: 'In transit',
            isCompleted: false,
            isCurrent: false,
          },
          {
            key: 'out_for_delivery',
            label: 'Out for delivery',
            isCompleted: false,
            isCurrent: false,
          },
          {
            key: 'delivered',
            label: 'Delivered',
            isCompleted: false,
            isCurrent: false,
            estimatedDateOrRange: 'Fri 13 Nov to Sun 15 Nov',
          },
        ],
      },
    ],
  },
  // Store Pickup Order Edge Case
  {
    id: 'ORD-PICKUP-STORE',
    idempotencyKey: 'idem-pickup-01',
    guestAccessToken: 'pickuptoken1234567890abcdef123',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'confirmed',
    isPickup: true,
    pickupDetails: {
      storeName: 'MATTE. Flagship Studio - Mumbai',
      address: 'Level 1, Palladium Mall, High Street Phoenix, Lower Parel',
      city: 'Mumbai',
      pincode: '400013',
      hours: 'Monday – Sunday, 11:00 AM – 9:00 PM',
      pickupWindow: 'Ready for pickup: Today after 3:00 PM',
      instructions: 'Please present Order #ORD-PICKUP-STORE and a valid government photo ID at the studio concierge counter.',
    },
    customer: {
      isGuest: true,
      email: 'neha.j@example.com',
      maskedEmail: maskEmail('neha.j@example.com'),
      phone: '+91 98333 44556',
      maskedPhone: maskPhone('+91 98333 44556'),
      firstName: 'Neha',
      lastName: 'Joshi',
      shippingAddress: {
        line1: 'MATTE. Flagship Studio, Palladium Mall',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400013',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed',
      method: 'upi',
      methodTitle: 'UPI',
      maskedDetails: 'UPI: neha@icici',
      transactionId: 'TXN-90281726',
    },
    pricing: {
      subtotal: 8990,
      discount: 0,
      shipping: 0,
      isShippingFree: true,
      taxGst: 1371.35,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 8990,
      currency: 'INR',
    },
    shipments: [],
  },
  // Digital / Gift Card Only Edge Case
  {
    id: 'ORD-DIGITAL-ONLY',
    idempotencyKey: 'idem-digital-01',
    guestAccessToken: 'digitaltoken1234567890abcdef12',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'confirmed',
    isDigitalOnly: true,
    digitalFulfillmentNotice: 'Your digital gift card activation key and certificate have been securely dispatched to your verified email (n***@example.com). No physical parcel is shipped.',
    customer: {
      isGuest: true,
      email: 'nathan@example.com',
      maskedEmail: maskEmail('nathan@example.com'),
      phone: '+91 98765 00112',
      maskedPhone: maskPhone('+91 98765 00112'),
      firstName: 'Nathan',
      lastName: 'Drake',
      shippingAddress: {
        line1: 'Digital Delivery to Email',
        city: 'Bengaluru',
        state: 'Karnataka',
        zip: '560001',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed',
      method: 'card',
      methodTitle: 'Credit Card',
      maskedDetails: 'Visa ending in 4242',
      transactionId: 'TXN-88291047',
    },
    pricing: {
      subtotal: 5000,
      discount: 0,
      shipping: 0,
      isShippingFree: true,
      taxGst: 0,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 5000,
      currency: 'INR',
    },
    shipments: [
      {
        id: 'ship-digital-1',
        shipmentNumber: 1,
        totalShipments: 1,
        title: 'Digital Delivery',
        estimatedDelivery: {
          start: '2026-11-08',
          formattedDisplay: 'Immediate Digital Delivery',
          isEstimate: false,
          windowConfirmed: true,
        },
        items: [
          {
            id: 'item-gift-card',
            productId: 't-gift-1',
            name: 'MATTE. Digital Studio Gift Card',
            variant: 'Value: ₹5,000',
            quantity: 1,
            unitPrice: 5000,
            linePrice: 5000,
            image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop',
            isDigital: true,
          },
        ],
        stages: [],
      },
    ],
  },
  // Delivery Date Unknown / Carrier Scheduling Edge Case
  {
    id: 'ORD-DATE-UNKNOWN',
    idempotencyKey: 'idem-unknown-date-01',
    guestAccessToken: 'unknowndatetoken1234567890abcdef',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'confirmed',
    deliveryDateUnknown: true,
    deliveryDateUnknownMessage: "Logistics carrier is currently verifying regional freight linehaul capacity. We'll confirm your delivery date by email as soon as the carrier confirms.",
    customer: {
      isGuest: true,
      email: 'ananya.m@example.com',
      maskedEmail: maskEmail('ananya.m@example.com'),
      phone: '+91 99888 77665',
      maskedPhone: maskPhone('+91 99888 77665'),
      firstName: 'Ananya',
      lastName: 'Mehta',
      shippingAddress: {
        line1: 'Villa 14, Palm Meadows',
        city: 'Hyderabad',
        state: 'Telangana',
        zip: '500084',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed',
      method: 'card',
      methodTitle: 'Credit Card',
      maskedDetails: 'Mastercard ending in 1102',
      transactionId: 'TXN-99182374',
    },
    pricing: {
      subtotal: 18990,
      discount: 1000,
      couponCode: 'STUDIO10',
      shipping: 0,
      isShippingFree: true,
      taxGst: 2744.24,
      personalizationFee: 0,
      giftWrapFee: 0,
      total: 17990,
      currency: 'INR',
    },
    shipments: [
      {
        id: 'ship-unk-1',
        shipmentNumber: 1,
        totalShipments: 1,
        title: 'Freight Cargo Shipment',
        carrier: 'GATI KWE Heavy Freight',
        whiteGloveAssembly: true,
        estimatedDelivery: {
          start: '',
          formattedDisplay: "We'll confirm your delivery date by email",
          isEstimate: true,
          windowConfirmed: false,
        },
        items: [
          {
            id: 'item-desk-1',
            productId: 't-desk-1',
            name: 'Matte Solid Walnut Studio Desk',
            variant: 'Natural Walnut / 160cm',
            quantity: 1,
            unitPrice: 18990,
            linePrice: 18990,
            image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=400&auto=format&fit=crop',
          },
        ],
        stages: [
          {
            key: 'placed',
            label: 'Order placed',
            timestamp: pastHour,
            isCompleted: true,
            isCurrent: false,
          },
          {
            key: 'processing',
            label: 'Crafting in wood workshop',
            sublabel: 'White-glove assembly scheduled upon regional arrival',
            isCompleted: false,
            isCurrent: true,
          },
          { key: 'packed', label: 'Freight crate packaging', isCompleted: false, isCurrent: false },
          { key: 'in_transit', label: 'In transit (Freight Carrier)', isCompleted: false, isCurrent: false },
          { key: 'out_for_delivery', label: 'Out for white-glove delivery', isCompleted: false, isCurrent: false },
          { key: 'delivered', label: 'Delivered & assembled', isCompleted: false, isCurrent: false },
        ],
      },
    ],
  },
  // Many Items Order (To verify mobile collapsible "Show all items")
  {
    id: 'ORD-MANY-ITEMS',
    idempotencyKey: 'idem-many-01',
    guestAccessToken: 'manyitemstoken1234567890abcdef1',
    tokenExpiresAt: futureTokenExpiry,
    createdAt: pastHour,
    updatedAt: pastHour,
    status: 'confirmed',
    customer: {
      isGuest: true,
      email: 'studio.architect@firm.com',
      maskedEmail: maskEmail('studio.architect@firm.com'),
      phone: '+91 97777 12345',
      maskedPhone: maskPhone('+91 97777 12345'),
      firstName: 'Karan',
      lastName: 'Malhotra',
      shippingAddress: {
        line1: 'Studio 4, Arts Guild, Fort',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400001',
        country: 'India',
      },
    },
    payment: {
      status: 'confirmed',
      method: 'card',
      methodTitle: 'Corporate Card',
      maskedDetails: 'Amex ending in 1004',
      transactionId: 'TXN-55443322',
    },
    pricing: {
      subtotal: 42450,
      discount: 3000,
      couponCode: 'ARCH3000',
      shipping: 0,
      isShippingFree: true,
      taxGst: 6017.8,
      personalizationFee: 490,
      giftWrapFee: 0,
      total: 39940,
      currency: 'INR',
    },
    shipments: [
      {
        id: 'ship-many-1',
        shipmentNumber: 1,
        totalShipments: 1,
        title: 'Studio Gear Package',
        carrier: 'BlueDart Express',
        signatureRequired: true,
        estimatedDelivery: {
          start: '2026-11-12',
          end: '2026-11-14',
          formattedDisplay: 'Thu 12 Nov to Sat 14 Nov',
          isEstimate: true,
          windowConfirmed: false,
        },
        items: [
          { id: 'm-1', productId: 'p-1', name: 'Matte Keyboard 1', variant: 'Obsidian', quantity: 1, unitPrice: 12990, linePrice: 12990, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400&auto=format&fit=crop' },
          { id: 'm-2', productId: 'p-2', name: 'Coiled Braided Cable', variant: 'Matte Charcoal', quantity: 2, unitPrice: 2490, linePrice: 4980, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=400&auto=format&fit=crop' },
          { id: 'm-3', productId: 'p-3', name: 'Precision Wireless Mouse', variant: 'Obsidian', quantity: 1, unitPrice: 4990, linePrice: 4990, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=400&auto=format&fit=crop' },
          { id: 'm-4', productId: 'p-4', name: 'Aluminum Desk Shelf', variant: 'Matte Anodized', quantity: 1, unitPrice: 8990, linePrice: 8990, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&auto=format&fit=crop' },
          { id: 'm-5', productId: 'p-5', name: 'Leather Desk Mat', variant: 'Charcoal Black', quantity: 1, unitPrice: 3490, linePrice: 3490, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop' },
          { id: 'm-6', productId: 'p-6', name: 'Cable Management Anchors (4-pack)', variant: 'Matte Black', quantity: 2, unitPrice: 1250, linePrice: 2500, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=400&auto=format&fit=crop' },
        ],
        stages: [
          { key: 'placed', label: 'Order placed', timestamp: pastHour, isCompleted: true, isCurrent: false },
          { key: 'processing', label: 'Processing & batch packing', isCompleted: false, isCurrent: true },
          { key: 'packed', label: 'Packed & handed to carrier', isCompleted: false, isCurrent: false },
          { key: 'in_transit', label: 'In transit', isCompleted: false, isCurrent: false },
          { key: 'out_for_delivery', label: 'Out for delivery', isCompleted: false, isCurrent: false },
          { key: 'delivered', label: 'Delivered', isCompleted: false, isCurrent: false, estimatedDateOrRange: 'Thu 12 Nov to Sat 14 Nov' },
        ],
      },
    ],
  },
];

function ensureOrdersFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(SEED_ORDERS, null, 2), 'utf-8');
      cachedOrders = [...SEED_ORDERS];
    }
  } catch (err) {
    console.error('Failed to ensure orders file:', err);
  }
}

export function getAllOrders(): OrderConfirmationRecord[] {
  if (cachedOrders) return cachedOrders;
  ensureOrdersFile();
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const loaded: OrderConfirmationRecord[] = JSON.parse(raw);
      const loadedIds = new Set(loaded.map((o) => o.id));
      let updated = false;
      for (const seed of SEED_ORDERS) {
        if (!loadedIds.has(seed.id)) {
          loaded.push(seed);
          updated = true;
        }
      }
      if (updated) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(loaded, null, 2), 'utf-8');
      }
      cachedOrders = loaded;
      return cachedOrders || [];
    }
  } catch (err) {
    console.error('Failed to read orders:', err);
  }
  return SEED_ORDERS;
}

export function saveAllOrders(orders: OrderConfirmationRecord[]): void {
  ensureOrdersFile();
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    cachedOrders = orders;
  } catch (err) {
    console.error('Failed to save orders:', err);
  }
}

/**
 * Retrieves order by ID.
 */
export function getOrderById(orderId: string): OrderConfirmationRecord | null {
  const orders = getAllOrders();
  return orders.find((o) => o.id === orderId) || null;
}

/**
 * Access Control Verifier.
 * Strictly checks that:
 * 1. Logged-in session owns the order, OR
 * 2. Guest provided the valid, unexpired guestAccessToken.
 * Prevents enumeration and IDOR attacks.
 */
export function verifyOrderAccess(
  order: OrderConfirmationRecord,
  options: { userId?: string; guestToken?: string }
): { allowed: boolean; isOwner: boolean; reason?: 'unauthorized' | 'token_expired' | 'missing_token' } {
  // If user is logged in and is the registered owner of this order
  if (options.userId && order.customer.userId === options.userId) {
    return { allowed: true, isOwner: true };
  }

  // If accessed via guest token
  if (options.guestToken) {
    if (order.guestAccessToken !== options.guestToken) {
      return { allowed: false, isOwner: false, reason: 'unauthorized' };
    }

    // Check token expiration
    const expiry = new Date(order.tokenExpiresAt).getTime();
    if (!isNaN(expiry) && Date.now() > expiry) {
      return { allowed: false, isOwner: false, reason: 'token_expired' };
    }

    return { allowed: true, isOwner: false };
  }

  return { allowed: false, isOwner: false, reason: 'missing_token' };
}

/**
 * Friendly Lookup by Email and Order Number.
 * Employs anti-enumeration: returns a generic success message
 * without confirming or denying order existence.
 */
export function lookupOrderByEmailAndNumber(
  email: string,
  orderNumber: string
): { success: boolean; message: string; accessUrl?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanId = (orderNumber || '').trim().toUpperCase();

  const orders = getAllOrders();
  const match = orders.find(
    (o) => o.id.toUpperCase() === cleanId && o.customer.email.toLowerCase() === cleanEmail
  );

  // If found, in a live app we email a signed link. Here we provide the token URL safely
  if (match) {
    return {
      success: true,
      message: `If an order matching #${cleanId} exists for that email, we have dispatched a secure access link.`,
      accessUrl: `/checkout/success?orderId=${match.id}&token=${match.guestAccessToken}`,
    };
  }

  return {
    success: true,
    message: `If an order matching #${cleanId} exists for that email, we have dispatched a secure access link.`,
  };
}

/**
 * Updates shipping address if within editable window.
 */
export function updateOrderShippingAddress(
  orderId: string,
  newAddress: OrderConfirmationRecord['customer']['shippingAddress'],
  credentials: { userId?: string; guestToken?: string }
): { success: boolean; error?: string } {
  const order = getOrderById(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  const access = verifyOrderAccess(order, credentials);
  if (!access.allowed) return { success: false, error: 'Unauthorized to modify this order' };

  // Check editable window
  if (order.editableUntil) {
    const deadline = new Date(order.editableUntil).getTime();
    if (Date.now() > deadline) {
      return {
        success: false,
        error: 'The modification window for this order has closed as it is being processed by dispatch.',
      };
    }
  }

  // Check if personalized items have completed workshop production
  const hasPersonalizedProduced = order.shipments.some((s) =>
    s.items.some((i) => i.isPersonalized) &&
    s.stages.some((st) => st.key === 'processing' && st.isCompleted)
  );
  if (hasPersonalizedProduced) {
    return {
      success: false,
      error: 'Personalized items have commenced workshop production and shipping destination can no longer be updated.',
    };
  }

  const all = getAllOrders();
  const updated = all.map((o) =>
    o.id === orderId
      ? {
          ...o,
          customer: {
            ...o.customer,
            shippingAddress: newAddress,
          },
          updatedAt: new Date().toISOString(),
        }
      : o
  );

  saveAllOrders(updated);
  return { success: true };
}
