import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function WishlistPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-12">Your Wishlist.</h1>
      <div className="border-t border-border pt-12">
        <EmptyState 
          icon={<Heart />} 
          title="Nothing to see here" 
          description="You haven't saved any items to your wishlist yet. Keep track of what you love." 
        />
      </div>
    </div>
  );
}
