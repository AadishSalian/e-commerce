import React from 'react';
import './Loader.css';

export const Loader: React.FC = () => {
  return (
    <div className="matte-loader-container">
      <div className="matte-loader" role="img" aria-label="Loading">
        <svg height="0" width="0">
          <defs>
            <linearGradient id="letterGrad" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="2">
              <stop offset="0" stopColor="#8a8478"></stop>
              <stop offset="1" stopColor="#f0ede6"></stop>
            </linearGradient>
          </defs>
        </svg>

        {/* m */}
        <svg className="matte-l1 inline-block" viewBox="0 0 34 60" width="40" height="60" fill="none">
          <path className="matte-dash" pathLength={360} stroke="url(#letterGrad)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"
            d="M4,52 L4,24 Q4,16 12,16 Q19,16 19,24 L19,52 M19,24 Q19,16 26,16 Q33,16 33,24 L33,52" />
        </svg>

        {/* a */}
        <svg className="matte-l2 inline-block" viewBox="0 0 30 60" width="34" height="60" fill="none">
          <path className="matte-dash" pathLength={360} stroke="url(#letterGrad)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"
            d="M22,23 L22,50 M22,36 C22,29 17.5,23 12,23 C6,23 2,29 2,36 C2,44 6,50 12,50 C17.5,50 22,44 22,36" />
        </svg>

        {/* t */}
        <svg className="matte-l3 inline-block" viewBox="0 0 26 60" width="30" height="60" fill="none">
          <path className="matte-dash" pathLength={360} stroke="url(#letterGrad)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"
            d="M13,4 L13,42 Q13,52 22,49 M3,18 L23,18" />
        </svg>

        {/* t */}
        <svg className="matte-l4 inline-block" viewBox="0 0 26 60" width="30" height="60" fill="none">
          <path className="matte-dash" pathLength={360} stroke="url(#letterGrad)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"
            d="M13,4 L13,42 Q13,52 22,49 M3,18 L23,18" />
        </svg>

        {/* e */}
        <svg className="matte-l5 inline-block" viewBox="0 0 32 60" width="36" height="60" fill="none">
          <path className="matte-dash" pathLength={360} stroke="url(#letterGrad)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"
            d="M6,34 L27,34 Q27,16 16,16 Q6,16 6,29 Q6,34 6,37 Q6,52 18,52 Q25,52 27,46" />
        </svg>

        {/* . */}
        <svg className="matte-l6 inline-block" viewBox="0 0 14 60" width="18" height="60" fill="none">
          <path className="matte-dash" pathLength={360} stroke="url(#letterGrad)" strokeWidth="8"
            strokeLinecap="round"
            d="M7,50 L7,52" />
        </svg>

      </div>

      <div className="matte-loader-caption">Loading</div>
    </div>
  );
};
