'use client';

import { use, useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ShoppingBag, Lock, Bell } from 'lucide-react';
import Link from 'next/link';
import { PrimaryButton, NavAuthButton, Accordion } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext';
import { useAlerts } from '@/contexts/AlertsContext';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import LiveActivityBadge from '@/components/product/LiveActivityBadge';
import ReviewsSection from '@/components/product/ReviewsSection';
import QnASection from '@/components/product/QnASection';
import StickyAddToCart from '@/components/product/StickyAddToCart';
import ProductViewer from '@/components/product/ProductViewer';
import SizeFitQuiz from '@/components/product/SizeFitQuiz';
import InPageNavigation from '@/components/product/InPageNavigation';
import { WishlistButton, ScrollProgress, Breadcrumbs } from '@/components/ui';

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
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1, selectedVariant || undefined);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  useEffect(() => {
    if (product) {
      addViewedProduct(product.id);
    }
  }, [product, addViewedProduct]);

  if (!product) return notFound();

  const productAccordionItems = [
    {
      id: 'description',
      title: 'Description',
      content: <p>{product.description}</p>
    },
    ...(product.hasSizeGuide ? [{
      id: 'size-guide',
      title: 'Size Guide',
      content: (
        <div className="w-full text-sm">
          <p className="mb-4">Our garments are designed with an intentionally oversized, relaxed fit. We recommend taking your true size for the intended look, or sizing down for a more traditional fit.</p>
          <div className="flex justify-between py-2 border-b border-border/50"><span className="text-foreground font-medium">Small</span><span>36-38" Chest</span></div>
          <div className="flex justify-between py-2 border-b border-border/50"><span className="text-foreground font-medium">Medium</span><span>38-40" Chest</span></div>
          <div className="flex justify-between py-2 border-b border-border/50"><span className="text-foreground font-medium">Large</span><span>40-42" Chest</span></div>
          <div className="flex justify-between py-2"><span className="text-foreground font-medium">X-Large</span><span>42-44" Chest</span></div>
        </div>
      )
    }] : []),
    {
      id: 'shipping',
      title: 'Shipping & Returns',
      content: <p>Free standard shipping on orders over $150. Returns accepted within 30 days of delivery for unworn items in original condition.</p>
    }
  ];

  return (
    <div className="min-h-screen bg-background relative pb-32">
      <ScrollProgress />
      <InPageNavigation />
      
      {/* Breadcrumbs */}
      <Breadcrumbs product={product} />

      <div id="overview" className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Left: Product Images */}
          <div className="w-full lg:w-2/3 h-[50vh] lg:h-[80vh]">
            <ProductViewer product={product} />
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

                    <span className="text-sm text-text-muted">{selectedVariant}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {product.variants?.map((v) => {
                    const isSelected = selectedVariant === v.value;
                    const style = v.materialImage 
                      ? { backgroundImage: `url(${v.materialImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { backgroundColor: v.value.toLowerCase().includes('sage') ? '#6b8a7a' : v.value.toLowerCase().includes('gray') ? '#232323' : '#121212' };
                      
                    return (
                      <div key={v.id} className="relative group">
                        <button
                          onClick={() => setSelectedVariant(v.value)}
                          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 overflow-hidden ${
                            isSelected ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background' : 'border-border hover:border-text-muted'
                          }`}
                          style={style}
                        >
                          {isSelected && !v.materialImage && <Check className="w-5 h-5 text-foreground drop-shadow-md" />}
                          {isSelected && v.materialImage && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Check className="w-5 h-5 text-white drop-shadow-md" /></div>}
                        </button>
                        
                        {/* Live Material Preview Hover */}
                        {v.materialImage && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 h-48 bg-surface border border-border rounded-xl shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden flex flex-col">
                            <div className="h-3/4 w-full" style={{ backgroundImage: `url(${v.materialImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div className="h-1/4 w-full flex items-center justify-center bg-background text-xs font-medium border-t border-border">
                              {v.value} Texture
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-b border-r border-border rotate-45" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {product.category === 'Fashion' && (
              <div className="mb-6 border border-accent/20 bg-accent/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Find Your Perfect Fit</h4>
                  <p className="text-xs text-text-muted mt-1">Take our 2-minute quiz for a personalized recommendation.</p>
                </div>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors whitespace-nowrap"
                >
                  Start Quiz
                </button>
              </div>
            )}

            <div id="details" className="mb-10">
              <Accordion items={productAccordionItems} />
            </div>

            <div className="hidden lg:flex flex-col gap-4 mt-auto pt-8 border-t border-border">
              <PrimaryButton 
                className="w-full py-4 text-lg" 
                icon={<ShoppingBag size={18} />}
                onClick={handleAddToCart}
                isSuccess={isAdded}
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
        <div id="reviews"><ReviewsSection productId={product.id} /></div>
        <div id="qna"><QnASection productId={product.id} /></div>
      </div>

      {/* Complete the Look Section */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div id="related" className="container mx-auto px-4 md:px-8 mt-24 mb-12">
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

      {/* Sticky Add to Cart Bar */}
      <StickyAddToCart 
        product={product} 
        selectedVariant={selectedVariant || undefined} 
        onAddToCart={() => addToCart(product, 1, selectedVariant || undefined)} 
      />

      <SizeFitQuiz 
        isOpen={showSizeGuide} 
        onClose={() => setShowSizeGuide(false)} 
        productName={product.name} 
      />
    </div>
  );
}
