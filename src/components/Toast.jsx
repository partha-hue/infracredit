'use client';

import React, { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
      const [isVisible, setIsVisible] = useState(true);

      useEffect(() => {
            const timer = setTimeout(() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300); // Wait for fade out animation
            }, duration);

            return () => clearTimeout(timer);
      }, [duration, onClose]);

      const colors = {
            success: 'bg-emerald-600 border-emerald-500 text-white',
            error: 'bg-rose-600 border-rose-500 text-white',
            info: 'bg-sky-600 border-sky-500 text-white',
            warning: 'bg-amber-500 border-amber-400 text-white'
      };

      const icons = {
            success: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
            ),
            error: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
            ),
            info: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
            ),
            warning: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
            )
      };

      return (
            <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
                  <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md ${colors[type]}`}>
                        <span className="flex-shrink-0">{icons[type]}</span>
                        <p className="text-sm font-black tracking-tight whitespace-nowrap">{message}</p>
                        <button onClick={() => setIsVisible(false)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                        </button>
                  </div>
            </div>
      );
}
