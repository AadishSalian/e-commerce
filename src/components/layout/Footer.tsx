'use client';

import Link from 'next/link';
import { NewsletterCard, RollingText } from '@/components/ui';

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t border-border pt-16 pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)] md:pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-4">
            <h2 className="text-foreground font-bold text-xl tracking-wide mb-4">MATTE.</h2>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              A premium e-commerce experience designed with restraint, precision, and an obsession for detail.
            </p>
          </div>

          {/* Links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-foreground text-sm font-semibold mb-6 uppercase tracking-wider">Shop</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/products?category=new" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">New Arrivals</RollingText></Link></li>
              <li><Link href="/products?category=tech" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Tech</RollingText></Link></li>
              <li><Link href="/products?category=accessories" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Accessories</RollingText></Link></li>
              <li><Link href="/products?category=objects" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Objects</RollingText></Link></li>
            </ul>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-foreground text-sm font-semibold mb-6 uppercase tracking-wider">Support</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/faq" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">FAQ</RollingText></Link></li>
              <li><Link href="/returns" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Returns & Exchanges</RollingText></Link></li>
              <li><Link href="/shipping" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Shipping Information</RollingText></Link></li>
              <li><Link href="/contact" className="group text-text-muted hover:text-foreground text-sm transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Contact Us</RollingText></Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1 lg:col-span-4 flex justify-center lg:justify-end">
            <NewsletterCard />
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} Matte Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="group text-text-muted hover:text-foreground text-xs transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Privacy Policy</RollingText></Link>
            <Link href="/terms" className="group text-text-muted hover:text-foreground text-xs transition-colors inline-block" data-roll-parent=""><RollingText duplicateColor="var(--text-primary)">Terms of Service</RollingText></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
