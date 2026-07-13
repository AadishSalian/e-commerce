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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Execute sign in logic
      console.log('Signing in...');
    } else {
      // Execute sign up logic
      console.log('Creating account...');
    }
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
                <form onSubmit={handleSubmit} className="w-full flex flex-col">
                  {!isLogin && (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputForm}>
                        <User className={styles.inputIcon} size={18} />
                        <input 
                          type="text" 
                          className={styles.inputField} 
                          placeholder="Full Name" 
                          aria-label="Full Name"
                          required={!isLogin}
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
                        required
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
                        required
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
                          required={!isLogin}
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
                        <input type="checkbox" className={styles.checkbox} required={!isLogin} aria-label="I agree to the terms & conditions" />
                        I agree to the terms & conditions
                      </label>
                    )}
                  </div>

                  <button type="submit" className={styles.primaryButton}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className={styles.divider}>Or With</div>

                <div className={styles.socialGroup}>
                  <button type="button" className={styles.socialBtn} aria-label="Sign in with Google">
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button type="button" className={styles.socialBtn} aria-label="Sign in with Apple">
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
