'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AuthCard.module.css';
import zxcvbn from 'zxcvbn';
import { hashPassword, checkHIBP } from '@/lib/auth-utils';

export default function AuthCard() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [passwordScore, setPasswordScore] = useState(0);
  const [isBreached, setIsBreached] = useState(false);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [error, setError] = useState('');

  // Calculate password strength
  useEffect(() => {
    if (password) {
      const evaluation = zxcvbn(password);
      setPasswordScore(evaluation.score);
    } else {
      setPasswordScore(0);
    }
  }, [password]);

  // Check HIBP with debounce
  useEffect(() => {
    if (!password || isLogin) {
      setIsBreached(false);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsCheckingBreach(true);
      const breached = await checkHIBP(password);
      setIsBreached(breached);
      setIsCheckingBreach(false);
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [password, isLogin]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (passwordScore < 2) {
        setError('Password is too weak. Please use a stronger password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (isBreached) {
        setError('This password has been found in a data breach. Please choose another.');
        return;
      }
    }
    
    try {
      const hashedPassword = await hashPassword(password);
      
      const userData = {
        id: Math.random().toString(36).substring(7),
        name: name || (isLogin ? 'Test User' : 'New User'),
        email: email,
        hashedPassword, // Storing for mock purposes
      };
      
      login(userData);
      router.push('/');
    } catch (err) {
      setError('An error occurred during authentication.');
      console.error(err);
    }
  };

  const getStrengthColor = () => {
    switch (passwordScore) {
      case 0: return '#ef4444';
      case 1: return '#f97316';
      case 2: return '#eab308';
      case 3: return '#84cc16';
      case 4: return '#22c55e';
      default: return '#3f3f46';
    }
  };

  const getStrengthLabel = () => {
    switch (passwordScore) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.formInner}>
          
          <div className={styles.logoWrapper}>
            <div className={styles.logoCircle}>m.</div>
          </div>
          
          <h2 className={styles.headerTitle}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className={styles.headerSubtitle}>
            {isLogin 
              ? 'Sign in to continue to your account.' 
              : 'Join us to experience premium quality.'}
          </p>

          <div style={{ position: 'relative' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={styles.viewContainer}
              >
                <form onSubmit={handleSubmit} className="w-full flex flex-col">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-500 text-sm">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {!isLogin && (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputForm}>
                        <User className={styles.inputIcon} size={18} />
                        <input 
                          type="text" 
                          className={styles.inputField} 
                          placeholder="Full Name" 
                          required={!isLogin}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.inputGroup}>
                    <div className={styles.inputForm}>
                      <Mail className={styles.inputIcon} size={18} />
                      <input 
                        type="email" 
                        className={styles.inputField} 
                        placeholder="Email Address" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.inputForm}>
                      <Lock className={styles.inputIcon} size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className={styles.inputField} 
                        placeholder="Password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button" 
                        className={styles.eyeToggle}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {!isLogin && password && (
                    <div className="mb-4 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted">Password strength:</span>
                        <span style={{ color: getStrengthColor(), fontWeight: 600 }}>{getStrengthLabel()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-active rounded-full overflow-hidden flex gap-1">
                        {[0, 1, 2, 3, 4].map((level) => (
                          <div 
                            key={level} 
                            className="h-full flex-1 transition-colors duration-300"
                            style={{ 
                              backgroundColor: passwordScore >= level ? getStrengthColor() : 'transparent' 
                            }}
                          />
                        ))}
                      </div>
                      {isCheckingBreach && <span className="text-xs text-text-muted mt-1">Checking for data breaches...</span>}
                      {isBreached && !isCheckingBreach && <span className="text-xs text-red-500 mt-1">⚠️ Password found in data breach!</span>}
                    </div>
                  )}

                  {!isLogin && (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputForm}>
                        <Lock className={styles.inputIcon} size={18} />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          className={styles.inputField} 
                          placeholder="Confirm Password" 
                          required={!isLogin}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button 
                          type="button" 
                          className={styles.eyeToggle}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.flexRow}>
                    {isLogin ? (
                      <>
                        <label className={styles.checkboxWrapper}>
                          <input type="checkbox" className={styles.checkbox} />
                          Remember me
                        </label>
                        <button type="button" className={styles.link} style={{ color: '#8ed500' }}>
                          Forgot password?
                        </button>
                      </>
                    ) : (
                      <label className={styles.checkboxWrapper}>
                        <input type="checkbox" className={styles.checkbox} required={!isLogin} />
                        I agree to the terms & conditions
                      </label>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className={styles.primaryButton}
                    style={{ backgroundColor: '#8ed500', color: '#121212' }}
                    disabled={(!isLogin && (isBreached || passwordScore < 2))}
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className={styles.divider}>Or With</div>

                <div className={styles.socialGroup}>
                  <button type="button" className={styles.socialBtn}>
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button" className={styles.socialBtn}>
                    <svg className={styles.socialIcon} viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    Apple
                  </button>
                </div>

                <p className={styles.footerText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" className={styles.link} onClick={toggleMode}>
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
