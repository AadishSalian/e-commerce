import Link from 'next/link';
import { Check } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-24 pb-32">
      <div className="container mx-auto px-4 text-center flex flex-col items-center max-w-lg">
        
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-border mb-8">
          <Check className="w-10 h-10 text-foreground" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Order Confirmed
        </h1>
        
        <p className="text-text-muted mb-10">
          Thank you for your purchase. Your order #ORD-938271 has been processed and is being prepared for shipment. You will receive an email confirmation shortly.
        </p>

        <div className="flex gap-4">
          <Link 
            href="/account"
            className="px-8 py-3 bg-surface border border-border text-foreground font-medium rounded-full hover:bg-surface-hover transition-colors duration-200"
          >
            View Order
          </Link>
          <Link 
            href="/products"
            className="px-8 py-3 bg-foreground text-background font-medium rounded-full hover:scale-[0.98] transition-transform duration-200"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
