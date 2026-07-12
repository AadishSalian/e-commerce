'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ShoppingBag, Lock } from 'lucide-react';
import Link from 'next/link';
import { PrimaryButton, NavAuthButton } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductDetailPage() {
  const params = useParams();
  const product = MOCK_PRODUCTS.find(p => p.id === params?.id);
  const { isLoggedIn, login } = useAuth();
  
  const hasVariants = product?.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? product.variants[0].value : null);

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
              className="w-full aspect-square md:aspect-[4/3] bg-surface rounded-2xl flex items-center justify-center relative border border-border"
            >
              <div className="absolute inset-0 bg-[#121212] opacity-40 rounded-2xl" />
              <span className="relative z-10 text-text-muted text-lg tracking-widest uppercase">
                {selectedVariant ? `${product.name} - ${selectedVariant}` : product.name}
              </span>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="w-full aspect-square bg-surface rounded-2xl flex items-center justify-center border border-border">
                  <span className="text-xs text-text-muted uppercase">Detail 1</span>
               </div>
               <div className="w-full aspect-square bg-surface rounded-2xl flex items-center justify-center border border-border">
                  <span className="text-xs text-text-muted uppercase">Detail 2</span>
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
            </div>

            {hasVariants && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">Color</h3>
                  <span className="text-sm text-text-muted">{selectedVariant}</span>
                </div>
                <div className="flex gap-4">
                  {product.variants.map((v) => {
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

            {/* Desktop Add to Bag (Sticky bar handles mobile) */}
            <div className="hidden lg:flex flex-col gap-4 mt-auto pt-8 border-t border-border">
              {isLoggedIn ? (
                <>
                  <PrimaryButton className="w-full py-4 text-lg" icon={<ShoppingBag size={18} />}>
                    Add to Bag
                  </PrimaryButton>
                  <p className="text-xs text-text-muted text-center flex items-center justify-center gap-2">
                    <Check className="w-3 h-3" /> In stock and ready to ship
                  </p>
                </>
              ) : (
                <>
                  <NavAuthButton className="w-full py-4" label="Sign In to Purchase" onClick={login} />
                  <p className="text-xs text-text-muted text-center flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3" /> Please sign in to unlock checkout
                  </p>
                </>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Scroll-based storytelling feature section */}
      <div className="mt-32 w-full bg-surface py-32 border-y border-border">
         <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">Uncompromising Quality.</h2>
            <p className="text-text-muted text-lg">Every element is scrutinized. The matte finish is achieved through a meticulous anodization process that creates a micro-texture at the structural level. No coatings. No paint. Just pure, engineered materials.</p>
         </div>
      </div>

      {/* Sticky "Add to Bag" Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40 flex items-center justify-between">
        <div>
          <p className="text-foreground font-medium text-lg">${product.price.toFixed(2)}</p>
          <p className="text-xs text-text-muted">Free shipping</p>
        </div>
        {isLoggedIn ? (
          <PrimaryButton className="px-8" icon={<ShoppingBag size={16} />}>
            Add to Bag
          </PrimaryButton>
        ) : (
          <NavAuthButton className="px-6" label="Sign In to Purchase" onClick={login} />
        )}
      </div>

    </div>
  );
}
