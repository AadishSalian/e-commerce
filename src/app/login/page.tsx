import React from 'react';
import AuthCard from '@/components/AuthCard';

export const metadata = {
  title: 'Sign In | MATTE.',
  description: 'Sign in to your MATTE account',
};

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Optional: subtle background gradient blobs for the page to complement the card's glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-surface-active rounded-full blur-[100px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-10 pointer-events-none" />
      
      <AuthCard />
    </div>
  );
}
