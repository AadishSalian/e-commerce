'use client';

import React, { useId } from 'react';
import styles from './LuminousCard.module.css';

export default function LuminousCard() {
  const id = useId();
  const toggleId = `luminousToggle-${id}`;
  const gradientId = `iconGradient-${id}`;
  const filterId = `strong-inner-${id}`;

  return (
    <div className={styles.cardContainer}>
      <input type="checkbox" className={styles.toggleInput} id={toggleId} />
      <label htmlFor={toggleId} className={styles.card}>
        <div className={styles.lightLayer}>
          <div className={styles.slit}></div>
          <div className={styles.lumen}>
            <div className={styles.min}></div>
            <div className={styles.mid}></div>
            <div className={styles.hi}></div>
          </div>
          <div className={styles.darken}>
            <div className={styles.sl}></div>
            <div className={styles.ll}></div>
            <div className={styles.slt}></div>
            <div className={styles.srt}></div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.icon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="6rem"
              height="2.5rem"
              viewBox="0 0 200 80"
            >
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill={`url(#${gradientId})`}
                filter={`url(#${filterId})`}
                style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}
              >
                MATTE.
              </text>
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="-1" y2="0.8">
                  <stop offset="0%" stopColor="#bbb"></stop>
                  <stop offset="100%" stopColor="#555"></stop>
                </linearGradient>
                <filter id={filterId}>
                  <feFlood floodColor="#fff2"></feFlood>
                  <feComposite operator="out" in2="SourceGraphic"></feComposite>
                  <feMorphology operator="dilate" radius="8"></feMorphology>
                  <feGaussianBlur stdDeviation="32"></feGaussianBlur>
                  <feComposite operator="atop" in2="SourceGraphic"></feComposite>
                </filter>
              </defs>
            </svg>
          </div>
          <div className={styles.bottom}>
            <div className={styles.title}>matte.</div>
            <p className={styles.description}>
              Refined premium materials <br />crafted for modern living.
            </p>
            <div className={styles.toggle}>
              <div className={styles.handle}></div>
              <span className={styles.toggleLabel}>Activate Lumen</span>
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}
