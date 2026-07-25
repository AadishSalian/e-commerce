'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, Camera, Lock, Bell, Check, MapPin, Phone, Shield, CreditCard, ChevronRight, LogOut
} from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const InputField = ({ label, type = 'text', value, onChange, placeholder, disabled = false }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-neutral-400">{label}</label>
    <div className="relative group">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#8ed500]/0 to-[#8ed500]/0 group-hover:from-[#8ed500]/20 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full relative bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#8ed500]/50 focus:ring-1 focus:ring-[#8ed500]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-inner"
      />
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, updateUser, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 (555) 000-0000');
  const [location, setLocation] = useState('New York, USA');

  useEffect(() => {
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!isLoggedIn || !user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      updateUser({ name, email });
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#000] pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto selection:bg-[#8ed500]/30 selection:text-white">
      
      {/* Header */}
      <div className="mb-12">
         <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Account Settings</h1>
         <p className="text-neutral-500 text-lg">Manage your account preferences and integrations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
         
         {/* Sidebar Navigation */}
         <nav className="w-full lg:w-64 flex flex-col gap-1 shrink-0">
           {TABS.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                 activeTab === tab.id 
                   ? 'bg-[#8ed500]/10 text-[#8ed500] shadow-[inset_0_0_0_1px_rgba(142,213,0,0.2)]' 
                   : 'text-neutral-400 hover:bg-white/5 hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
               }`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
           
           <div className="h-px bg-white/10 my-4" />
           
           <button 
             onClick={handleLogout}
             className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
           >
             <LogOut className="w-4 h-4" />
             Sign Out
           </button>
         </nav>

         {/* Main Content Area */}
         <div className="flex-1 max-w-4xl">
           <AnimatePresence mode="wait">
             
             {activeTab === 'general' && (
               <motion.div 
                 key="general"
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3 }}
                 className="flex flex-col gap-8"
               >
                 
                 {/* Avatar Section */}
                 <div className="bg-[#050505] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                   <div className="flex items-center gap-6">
                     <div className="relative w-24 h-24 rounded-full bg-neutral-900 border border-white/10 overflow-hidden group shadow-xl">
                       {user.avatar ? (
                         <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-neutral-800 to-neutral-900">
                           {name ? name.charAt(0).toUpperCase() : '?'}
                         </span>
                       )}
                       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 cursor-pointer">
                         <Camera className="w-6 h-6 text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
                       </div>
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-white mb-1">Avatar</h3>
                       <p className="text-sm text-neutral-500">JPG, GIF or PNG. 1MB max.</p>
                     </div>
                   </div>
                   <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] w-full md:w-auto">
                     Upload New
                   </button>
                 </div>

                 {/* Personal Info Form */}
                 <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                   <div className="p-6 md:p-8 border-b border-white/10">
                     <h3 className="text-xl font-bold text-white mb-1">Personal Information</h3>
                     <p className="text-sm text-neutral-500">Update your basic profile details.</p>
                   </div>
                   
                   <div className="p-6 md:p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <InputField label="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} />
                       <InputField label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                       <InputField label="Phone Number" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
                       <InputField label="Location" value={location} onChange={(e: any) => setLocation(e.target.value)} />
                     </div>
                     
                     <div className="flex items-center justify-end">
                       <button 
                         onClick={handleSave} 
                         disabled={isSaving}
                         className="px-8 py-3 bg-[#8ed500] hover:bg-[#7ac200] text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(142,213,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 flex items-center gap-2 text-sm"
                       >
                         {saved ? <><Check className="w-4 h-4"/> Saved successfully</> : isSaving ? 'Saving changes...' : 'Save Changes'}
                       </button>
                     </div>
                   </div>
                 </div>

               </motion.div>
             )}

             {activeTab === 'security' && (
               <motion.div 
                 key="security"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                 className="flex flex-col gap-8"
               >
                 <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                   <div className="p-6 md:p-8 border-b border-white/10">
                     <h3 className="text-xl font-bold text-white mb-1">Change Password</h3>
                     <p className="text-sm text-neutral-500">Update your password associated with your account.</p>
                   </div>
                   <div className="p-6 md:p-8 flex flex-col gap-6 max-w-md">
                     <InputField label="Current Password" type="password" placeholder="••••••••" />
                     <InputField label="New Password" type="password" placeholder="••••••••" />
                     <InputField label="Confirm New Password" type="password" placeholder="••••••••" />
                     <button className="px-6 py-3 mt-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm w-fit border border-white/10">
                       Update Password
                     </button>
                   </div>
                 </div>
                 
                 <div className="bg-[#050505] border border-red-500/20 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl pointer-events-none rounded-full" />
                   <div className="p-6 md:p-8 relative z-10">
                     <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
                     <p className="text-sm text-neutral-400 mb-6">Permanently delete your account and all of your data.</p>
                     <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors text-sm border border-red-500/20">
                       Delete Account
                     </button>
                   </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'notifications' && (
               <motion.div 
                 key="notifications"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
               >
                 <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-6 md:p-8 flex items-center justify-center min-h-[300px]">
                   <p className="text-neutral-500">Notification settings coming soon.</p>
                 </div>
               </motion.div>
             )}

             {activeTab === 'billing' && (
               <motion.div 
                 key="billing"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
               >
                 <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-6 md:p-8 flex items-center justify-center min-h-[300px]">
                   <p className="text-neutral-500">Billing history coming soon.</p>
                 </div>
               </motion.div>
             )}

           </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
