import React from 'react';
import SocialLinks from '@/components/SocialLinks';
import LuminousCard from '@/components/LuminousCard';
import { TeamMemberCard } from '@/components/ui';

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
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">What We Stand For</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Quality', desc: 'Uncompromising standards.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { title: 'Simplicity', desc: 'Less, but better.', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { title: 'Trust', desc: 'Transparency in everything.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z' },
            { title: 'Sustainability', desc: 'For a better tomorrow.', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((val, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-hover transition-colors">
              <svg className="w-8 h-8 text-accent mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={val.icon} />
              </svg>
              <h3 className="text-xl font-semibold mb-2">{val.title}</h3>
              <p className="text-text-muted">{val.desc}</p>
            </div>
          ))}
        </div>
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
