'use client';

import { useState } from 'react';
import { Star, ShieldCheck, Image as ImageIcon, Quote } from 'lucide-react';
import { getProductReviews, Review } from '@/lib/mockSocialProof';
import { PrimaryButton, AnimatedCounter } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  productId: string;
}

export default function ReviewsSection({ productId }: Props) {
  const reviews = getProductReviews(productId);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const averageRating = reviews.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <div className="py-12 border-t border-border">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Reviews Summary */}
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-bold text-foreground mb-6">Customer Reviews</h2>
          
          <div className="flex items-end gap-4 mb-6">
            <AnimatedCounter value={Number(averageRating)} decimals={1} className="text-5xl font-bold text-foreground" />
            <div className="flex flex-col mb-1">
              <div className="flex text-accent">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? 'fill-accent' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-sm text-text-muted mt-1 flex gap-1">
                Based on <AnimatedCounter value={reviews.length} /> reviews
              </span>
            </div>
          </div>
          
          {/* Mock progress bars for ratings */}
          <div className="flex flex-col gap-2 mb-8">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-3">{star}</span>
                  <Star className="w-3 h-3 text-text-muted" />
                  <div className="flex-grow h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-foreground" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="w-8 text-right text-text-muted">{count}</span>
                </div>
              )
            })}
          </div>

          <PrimaryButton 
            className="w-full py-3 bg-surface text-foreground border border-border hover:bg-surface-hover"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
          </PrimaryButton>

          <AnimatePresence>
            {showReviewForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 border border-border rounded-xl bg-surface">
                  <h4 className="font-semibold mb-4 text-sm">Share your experience</h4>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-6 h-6 text-border hover:text-accent cursor-pointer transition-colors" />)}
                  </div>
                  <textarea className="w-full bg-background border border-border rounded-lg p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:border-accent" placeholder="What did you think about this product?"></textarea>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm text-text-muted hover:text-foreground">
                      <ImageIcon className="w-4 h-4" /> Add Photos
                    </button>
                    <PrimaryButton className="ml-auto px-6 py-2 text-sm">Submit</PrimaryButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews List & Highlights */}
        <div className="w-full md:w-2/3 flex flex-col gap-8">
          
          {/* Pull-quote style highlights */}
          {reviews.length > 0 && reviews.filter(r => r.rating >= 4 && r.content.length > 60).slice(0, 1).map((highlight) => (
            <div key={`highlight-${highlight.id}`} className="bg-surface border border-border p-8 rounded-2xl relative mb-4">
              <Quote className="absolute top-6 left-6 w-12 h-12 text-accent/20 rotate-180" />
              <div className="relative z-10 pl-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= highlight.rating ? 'fill-accent text-accent' : 'text-border'}`} />
                  ))}
                </div>
                <p className="text-xl md:text-2xl font-medium text-foreground leading-snug mb-6 italic">
                  "{highlight.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    {highlight.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {highlight.author}
                      {highlight.verifiedPurchase && <ShieldCheck className="w-4 h-4 text-[#8ed500]" />}
                    </div>
                    <div className="text-xs text-text-muted">Verified Customer</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p>No reviews yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-8 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{review.author}</span>
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-[#8ed500] bg-[#8ed500]/10 px-2 py-0.5 rounded-sm font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-accent text-accent' : 'text-border'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-text-muted">{new Date(review.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                
                <p className="text-text-muted text-sm leading-relaxed mt-4">
                  {review.content}
                </p>

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-3 mt-4">
                    {review.photos.map((photo, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedPhoto(photo)}
                        className="w-20 h-20 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                      >
                        <img src={photo} alt="Review upload" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full aspect-square md:aspect-video bg-surface rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-background/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-background/80 transition-colors">
              ✕
            </button>
            <img src={selectedPhoto} alt="Review upload full size" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
