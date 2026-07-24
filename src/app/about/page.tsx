import React from 'react';
import SocialLinks from '@/components/SocialLinks';
import LuminousCard from '@/components/LuminousCard';
import { TeamMemberCard } from '@/components/ui';
import ValuesTabs from '@/components/about/ValuesTabs';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">About Us</h1>
        <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto">
          Premium products. Quality-first mindset. Minimal design philosophy.
        </p>
      </section>

      {/* Our Story */}
      <section className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-text-muted leading-relaxed">
              <p>
                Founded in 2024, our mission was simple: to strip away the noise and focus on what truly matters. In a world saturated with over-designed products, we saw a need for premium quality essentials that speak for themselves.
              </p>
              <p>
                We believe that good design is invisible. It’s not about flashy logos or glossy finishes; it’s about the perfect fit, the right texture, and a customer-first experience that prioritizes your needs above everything else.
              </p>
              <p>
                Every product we offer is carefully curated to meet our strict standards for sustainability, durability, and minimal aesthetics. We don’t just sell products; we offer a refined lifestyle.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <LuminousCard />
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center md:text-left">What We Stand For</h2>
        <ValuesTabs />
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Alex Rivera', role: 'Founder & CEO', initials: 'AR', bio: 'Obsessed with matte finishes and minimal architecture.' },
              { name: 'Sam Taylor', role: 'Head of Design', initials: 'ST', bio: 'Former industrial designer. Lives for typography.' },
              { name: 'Jordan Lee', role: 'Lead Engineer', initials: 'JL', bio: 'Builds systems that scale. Keyboard enthusiast.' },
              { name: 'Casey Smith', role: 'Customer Experience', initials: 'CS', bio: 'Ensures every unboxing feels like a luxury event.' }
            ].map((member, i) => (
              <TeamMemberCard 
                key={i}
                name={member.name}
                role={member.role}
                initials={member.initials}
                bio={member.bio}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Connect With Us */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">Connect With Us</h2>
        <SocialLinks />
      </section>
    </main>
  );
}
