'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import styles from './AuthCard.module.css';

export default function AuthCard() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Reset password visibility when switching modes
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.formInner}>
          
          <div className={styles.logoWrapper}>
            <div className={styles.logoCircle}>M.</div>
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
                {!isLogin && (
                  <div className={styles.inputGroup}>
                    <div className={styles.inputForm}>
                      <User className={styles.inputIcon} size={18} />
                      <input 
                        type="text" 
                        className={styles.inputField} 
                        placeholder="Full Name" 
                        aria-label="Full Name"
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
                      aria-label="Email Address"
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
                      aria-label="Password"
                    />
                    <button 
                      type="button" 
                      className={styles.eyeToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className={styles.inputGroup}>
                    <div className={styles.inputForm}>
                      <Lock className={styles.inputIcon} size={18} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        className={styles.inputField} 
                        placeholder="Confirm Password" 
                        aria-label="Confirm Password"
                      />
                      <button 
                        type="button" 
                        className={styles.eyeToggle}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                        <input type="checkbox" className={styles.checkbox} aria-label="Remember me" />
                        Remember me
                      </label>
                      <button type="button" className={styles.link}>
                        Forgot password?
                      </button>
                    </>
                  ) : (
                    <label className={styles.checkboxWrapper}>
                      <input type="checkbox" className={styles.checkbox} aria-label="I agree to the terms & conditions" />
                      I agree to the terms & conditions
                    </label>
                  )}
                </div>

                <button className={styles.primaryButton}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>

                <div className={styles.divider}>Or With</div>

                <div className={styles.socialGroup}>
                  <button className={styles.socialBtn} aria-label="Sign in with Google">
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button className={styles.socialBtn} aria-label="Sign in with Apple">
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.365 6.877c1.144-1.385 1.916-3.322 1.706-5.253-1.637.066-3.669 1.09-4.846 2.476-.942 1.097-1.859 3.076-1.597 4.966 1.83.142 3.593-.805 4.737-2.189zm-1.002 1.341c-2.316-.142-4.484 1.282-5.618 1.282-1.164 0-2.95-1.258-4.887-1.21-2.528.048-4.864 1.472-6.176 3.758-2.656 4.614-.678 11.455 1.906 15.19 1.258 1.829 2.768 3.847 4.76 3.776 1.916-.072 2.646-1.235 4.962-1.235 2.316 0 2.978 1.235 4.985 1.187 2.054-.047 3.376-1.875 4.605-3.68 1.425-2.08 2.016-4.095 2.04-4.202-.047-.024-3.92-1.508-3.968-6.027-.048-3.776 3.08-5.581 3.223-5.676-1.782-2.614-4.535-2.97-5.508-3.044z"/>
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
