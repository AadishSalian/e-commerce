import Hero from '@/components/home/Hero';
import SalesSection from '@/components/home/SalesSection';
import FeatureSection from '@/components/home/FeatureSection';
import ProductCarousel from '@/components/home/ProductCarousel';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <SalesSection />
      
      <FeatureSection 
        title="Precision in every detail."
        description="Our products are machined with exacting tolerances. The soft-touch matte finish isn't just an aesthetic choice—it's engineered to resist fingerprints and wear, ensuring your device looks immaculate from day one to year five."
        imageAlt="Macro shot of matte texture"
        matteVariant="elevated"
      />
      
      <ProductCarousel />
      
      <FeatureSection 
        title="Designed to disappear."
        description="Technology shouldn't demand your attention. We believe in tools that quietly facilitate your work. Flat surfaces, muted tones, and intuitive interfaces that get out of your way."
        imageAlt="Workspace with matte products"
        reverse={true}
        matteVariant="deep"
      />
    </div>
  );
}
