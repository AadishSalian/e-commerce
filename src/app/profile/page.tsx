'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, Camera, Lock, Bell, Check, MapPin, Phone, Shield, CreditCard, ChevronRight, LogOut, Sliders, Moon, Sun
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';

const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const InputField = ({ label, type = 'text', value, onChange, placeholder, disabled = false }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-neutral-400">{label}</label>
    <div className="relative group">
      <div className="absolute inset-0 rounded-lg bg-accent/0 group-hover:bg-accent/10 transition-all duration-500 blur-sm pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full relative bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-inner"
      />
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success } = useToast();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

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
      success("Profile details updated successfully.");
    }, 800);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto selection:bg-accent/30 selection:text-foreground">
      
      {/* Header */}
      <div className="mb-12">
         <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Account Settings</h1>
         <p className="text-text-muted text-lg">Manage your account preferences and integrations.</p>
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
                   ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(var(--accent),0.2)]' 
                   : 'text-text-muted hover:bg-surface-hover hover:text-foreground hover:shadow-[inset_0_0_0_1px_var(--border)]'
               }`}
             >
               <tab.icon className="w-4 h-4" />
               {tab.label}
             </button>
           ))}
           
           <div className="h-px bg-border my-4" />
           
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
                 <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                   <div className="flex items-center gap-6">
                     <div className="relative w-24 h-24 rounded-full bg-surface-active border border-border overflow-hidden group shadow-md">
                       {user.avatar ? (
                         <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-foreground bg-gradient-to-br from-surface to-surface-active">
                           {name ? name.charAt(0).toUpperCase() : '?'}
                         </span>
                       )}
                       <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 cursor-pointer">
                         <Camera className="w-6 h-6 text-foreground scale-75 group-hover:scale-100 transition-transform duration-300" />
                       </div>
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-foreground mb-1">Avatar</h3>
                       <p className="text-sm text-text-muted">JPG, GIF or PNG. 1MB max.</p>
                     </div>
                   </div>
                   <button className="px-5 py-2.5 bg-surface-hover hover:bg-surface-active border border-border rounded-xl text-sm font-semibold text-foreground transition-all w-full md:w-auto">
                     Upload New
                   </button>
                 </div>

                 {/* Personal Info Form */}
                 <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                   <div className="p-6 md:p-8 border-b border-border">
                     <h3 className="text-xl font-bold text-foreground mb-1">Personal Information</h3>
                     <p className="text-sm text-text-muted">Update your basic profile details.</p>
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
                         className="px-8 py-3 bg-accent hover:opacity-90 text-background font-bold rounded-xl transition-all disabled:opacity-70 flex items-center gap-2 text-sm"
                       >
                         {isSaving ? 'Saving changes...' : 'Save Changes'}
                       </button>
                     </div>
                   </div>
                 </div>

               </motion.div>
             )}

             {activeTab === 'preferences' && (
               <motion.div 
                 key="preferences"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                 className="flex flex-col gap-8"
               >
                 <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                   <div className="p-6 md:p-8 border-b border-border">
                     <h3 className="text-xl font-bold text-foreground mb-1">System Configuration</h3>
                     <p className="text-sm text-text-muted">Manage your application appearance and global settings.</p>
                   </div>
                   
                   <div className="p-6 md:p-8 flex flex-col gap-8">
                     {/* Theme Settings */}
                     <div>
                       <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Appearance</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <button 
                           onClick={() => setTheme('dark')}
                           className={`p-4 rounded-xl border flex flex-col gap-3 text-left transition-all ${
                             theme === 'dark' 
                               ? 'border-accent bg-accent/10 shadow-sm' 
                               : 'border-border bg-surface-hover hover:bg-surface-active'
                           }`}
                         >
                           <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-accent' : 'text-text-muted'}`} />
                           <div>
                             <p className="text-foreground font-medium">Dark Mode</p>
                             <p className="text-xs text-text-muted mt-1">High contrast, easy on the eyes.</p>
                           </div>
                         </button>
                         <button 
                           onClick={() => setTheme('light')}
                           className={`p-4 rounded-xl border flex flex-col gap-3 text-left transition-all ${
                             theme === 'light' 
                               ? 'border-accent bg-accent/10 shadow-sm' 
                               : 'border-border bg-surface-hover hover:bg-surface-active'
                           }`}
                         >
                           <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-accent' : 'text-text-muted'}`} />
                           <div>
                             <p className="text-foreground font-medium">Light Mode</p>
                             <p className="text-xs text-text-muted mt-1">Clean and vibrant appearance.</p>
                           </div>
                         </button>
                       </div>
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
                 <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
                   <div className="p-6 md:p-8 border-b border-border">
                     <h3 className="text-xl font-bold text-foreground mb-1">Change Password</h3>
                     <p className="text-sm text-text-muted">Update your password associated with your account.</p>
                   </div>
                   <div className="p-6 md:p-8 flex flex-col gap-6 max-w-md">
                     <InputField label="Current Password" type="password" placeholder="••••••••" />
                     <InputField label="New Password" type="password" placeholder="••••••••" />
                     <InputField label="Confirm New Password" type="password" placeholder="••••••••" />
                     <button className="px-6 py-3 mt-4 bg-surface-hover hover:bg-surface-active text-foreground font-bold rounded-xl transition-colors text-sm w-fit border border-border">
                       Update Password
                     </button>
                   </div>
                 </div>
                 
                 <div className="bg-surface border border-red-500/30 rounded-3xl overflow-hidden shadow-sm relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl pointer-events-none rounded-full" />
                   <div className="p-6 md:p-8 relative z-10">
                     <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
                     <p className="text-sm text-text-muted mb-6">Permanently delete your account and all of your data.</p>
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
                 <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm p-6 md:p-8 flex items-center justify-center min-h-[300px]">
                   <p className="text-text-muted">Notification settings coming soon.</p>
                 </div>
               </motion.div>
             )}

             {activeTab === 'billing' && (
               <motion.div 
                 key="billing"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
               >
                 <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm p-6 md:p-8 flex items-center justify-center min-h-[300px]">
                   <p className="text-text-muted">Billing history coming soon.</p>
                 </div>
               </motion.div>
             )}

           </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
