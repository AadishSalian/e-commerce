'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ShoppingBag, Lock, Bell } from 'lucide-react';
import Link from 'next/link';
import { PrimaryButton, NavAuthButton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext';
import { useAlerts } from '@/contexts/AlertsContext';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import LiveActivityBadge from '@/components/product/LiveActivityBadge';
import ReviewsSection from '@/components/product/ReviewsSection';
import QnASection from '@/components/product/QnASection';
import StickyAddToCart from '@/components/product/StickyAddToCart';
import { useEffect } from 'react';

type Props = {
  params: Promise<{ id: string }>;
};

export default function ProductDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const product = MOCK_PRODUCTS.find(p => p.id === resolvedParams.id);
  const { isLoggedIn } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const hasVariants = product?.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? product.variants![0].value : null);
  const { addViewedProduct } = useRecentlyViewed();
  const { hasAlert, addAlert, removeAlert } = useAlerts();
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    if (product) {
      addViewedProduct(product.id);
    }
  }, [product, addViewedProduct]);

  if (!product) return notFound();

  return (
    <div className="min-h-screen bg-background relative pb-32">
      
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 md:px-8 py-6 flex items-center text-sm text-text-muted">
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Left: Product Images */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full aspect-square md:aspect-[4/3] bg-surface rounded-2xl flex items-center justify-center relative border border-border overflow-hidden"
            >
              <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </motion.div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="w-full aspect-square bg-surface rounded-2xl flex items-center justify-center border border-border relative overflow-hidden">
                  {product.hoverImage ? <img src={product.hoverImage} alt={`${product.name} detail 1`} className="absolute inset-0 w-full h-full object-cover" /> : <span className="text-xs text-text-muted uppercase relative z-10">Detail 1</span>}
               </div>
               <div className="w-full aspect-square bg-surface rounded-2xl flex items-center justify-center border border-border relative overflow-hidden">
                  <img src={product.image} alt={`${product.name} detail 2`} className="absolute inset-0 w-full h-full object-cover" />
               </div>
            </div>
          </div>

          {/* Right: Sticky Configurator Panel */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-24 flex flex-col">
            <div className="mb-8">
              <p className="text-sm text-accent uppercase tracking-widest mb-2 font-medium">New Release</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-2xl text-foreground font-medium mb-6">
                ${product.price.toFixed(2)}
              </p>
              <p className="text-text-muted text-base leading-relaxed">
                {product.description}
              </p>
              
              <LiveActivityBadge productId={product.id} />
              
              {product.stockCount !== undefined && product.stockCount < 5 && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[#8ed500]/10 text-[#8ed500] rounded-sm font-medium text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8ed500] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8ed500]"></span>
                  </span>
                  Only {product.stockCount} left in stock - order soon
                </div>
              )}
            </div>

            {hasVariants && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">Color</h3>
                  <div className="flex items-center gap-4">
                    {product.hasSizeGuide && (
                      <button 
                        onClick={() => setShowSizeGuide(true)}
                        className="text-sm text-text-muted hover:text-foreground underline underline-offset-4"
                      >
                        Size Guide
                      </button>
                    )}
                    <span className="text-sm text-text-muted">{selectedVariant}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  {product.variants?.map((v) => {
                    const isSelected = selectedVariant === v.value;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v.value)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected ? 'border-accent' : 'border-border hover:border-text-muted'
                        }`}
                        // Simple color mapping for demo purposes
                        style={{ backgroundColor: v.value.toLowerCase().includes('sage') ? '#6b8a7a' : v.value.toLowerCase().includes('gray') ? '#232323' : '#121212' }}
                      >
                        {isSelected && <Check className="w-5 h-5 text-foreground" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Desktop Add to Bag (Sticky bar handles mobile/scrolling) */}
            <div className="hidden lg:flex flex-col gap-4 mt-auto pt-8 border-t border-border">
              <PrimaryButton 
                className="w-full py-4 text-lg" 
                icon={<ShoppingBag size={18} />}
                onClick={() => {
                  addToCart(product, 1, selectedVariant || undefined);
                }}
              >
                Add to Bag
              </PrimaryButton>
              <p className="text-xs text-text-muted text-center flex items-center justify-center gap-2">
                <Check className="w-3 h-3" /> In stock and ready to ship
              </p>
              
              {/* Alerts Button */}
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    const type = product.stockCount === 0 ? 'BACK_IN_STOCK' : 'PRICE_DROP';
                    if (hasAlert(product.id, type)) {
                      removeAlert(product.id, type);
                    } else {
                      addAlert(product.id, type);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium hover:bg-surface-hover hover:border-text-muted transition-all"
                >
                  <Bell className={`w-4 h-4 ${hasAlert(product.id, product.stockCount === 0 ? 'BACK_IN_STOCK' : 'PRICE_DROP') ? 'fill-accent text-accent' : ''}`} />
                  {hasAlert(product.id, product.stockCount === 0 ? 'BACK_IN_STOCK' : 'PRICE_DROP') 
                    ? 'Watching for ' + (product.stockCount === 0 ? 'Restock' : 'Price Drop')
                    : 'Watch for ' + (product.stockCount === 0 ? 'Restock' : 'Price Drop')
                  }
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Social Proof: Reviews and Q&A */}
      <div className="container mx-auto px-4 md:px-8 mt-16">
        <ReviewsSection productId={product.id} />
        <QnASection productId={product.id} />
      </div>

      {/* Complete the Look Section */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="container mx-auto px-4 md:px-8 mt-24 mb-12">
          <h2 className="text-2xl font-bold mb-8">Complete the Look</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {product.relatedProducts.map(relId => {
              const rel = MOCK_PRODUCTS.find(p => p.id === relId);
              if (!rel) return null;
              return (
                <Link key={rel.id} href={`/products/${rel.id}`} className="group block">
                  <div className="w-full aspect-square bg-muted rounded-xl mb-4 overflow-hidden">
                    <img src={rel.image} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{rel.name}</h4>
                  <p className="text-text-muted text-sm">${rel.price.toFixed(2)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <RecentlyViewed />

      {/* Size Guide Modal Overlay */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border p-8 rounded-2xl max-w-md w-full relative">
            <button onClick={() => setShowSizeGuide(false)} className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-full">
              <span className="sr-only">Close</span>
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-4">Size Guide</h3>
            <p className="text-text-muted mb-6">Our garments are designed with an intentionally oversized, relaxed fit. We recommend taking your true size for the intended look, or sizing down for a more traditional fit.</p>
            <div className="w-full border-t border-border pt-4">
              <div className="flex justify-between py-2 border-b border-border/50 text-sm"><span className="text-text-muted">Small</span><span>36-38" Chest</span></div>
              <div className="flex justify-between py-2 border-b border-border/50 text-sm"><span className="text-text-muted">Medium</span><span>38-40" Chest</span></div>
              <div className="flex justify-between py-2 border-b border-border/50 text-sm"><span className="text-text-muted">Large</span><span>40-42" Chest</span></div>
              <div className="flex justify-between py-2 text-sm"><span className="text-text-muted">X-Large</span><span>42-44" Chest</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Add to Cart Bar */}
      <StickyAddToCart 
        product={product} 
        selectedVariant={selectedVariant || undefined} 
        onAddToCart={() => addToCart(product, 1, selectedVariant || undefined)} 
      />

    </div>
  );
}
