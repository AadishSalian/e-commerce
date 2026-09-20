import dynamic from 'next/dynamic';
import Hero from '@/components/home/Hero';
import CategoryWidgets from '@/components/home/CategoryWidgets';
import WelcomeBanner from '@/components/home/WelcomeBanner';
import { PullToRefreshWrapper } from '@/components/home/PullToRefreshWrapper';

const CategoryShowcase = dynamic(() => import('@/components/home/CategoryShowcase'), { ssr: true });
const SalesSection = dynamic(() => import('@/components/home/SalesSection'), { ssr: true });
const FeatureSection = dynamic(() => import('@/components/home/FeatureSection'), { ssr: true });
const ProductCarousel = dynamic(() => import('@/components/home/ProductCarousel'), { ssr: true });
const ForYouSection = dynamic(() => import('@/components/home/ForYouSection'), { ssr: true });

export default function Home() {
  return (
    <PullToRefreshWrapper>
      <div className="flex flex-col w-full">
        <WelcomeBanner />
        <CategoryWidgets />
      <Hero />
      <ForYouSection />
      <CategoryShowcase />
      <SalesSection />
      
      <FeatureSection 
        title="Precision in every detail."
        description="Our products are machined with exacting tolerances. The soft-touch matte finish isn't just an aesthetic choice—it's engineered to resist fingerprints and wear, ensuring your device looks immaculate from day one to year five."
        imageAlt="Macro shot of matte texture"
        imageUrl="https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=1000&auto=format&fit=crop"
        matteVariant="elevated"
      />
      
      <ProductCarousel />
      
        <FeatureSection 
          title="Designed to disappear."
          description="Technology shouldn't demand your attention. We believe in tools that quietly facilitate your work. Flat surfaces, muted tones, and intuitive interfaces that get out of your way."
          imageAlt="Workspace with matte products"
          imageUrl="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop"
          reverse={true}
          matteVariant="deep"
        />
      </div>
    </PullToRefreshWrapper>
  );
}
