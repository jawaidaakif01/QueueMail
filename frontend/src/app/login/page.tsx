"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Login</h1>
        
        <a 
          href="http://localhost:5000/api/auth/google"
          className="w-full flex items-center justify-center gap-3 bg-[#EAF5F0] hover:bg-[#DDF0E6] text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors mb-6"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          Login with Google
        </a>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-xs text-gray-400 bg-white">or sign up through email</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          window.location.href = "http://localhost:5000/api/auth/google";
        }}>
          <div>
            <input 
              type="email" 
              placeholder="Email ID" 
              className="w-full bg-[#F7F9F8] border-none rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#10A37F] outline-none placeholder:text-gray-400 transition-shadow text-gray-900"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-[#F7F9F8] border-none rounded-lg px-4 py-3.5 text-sm focus:ring-2 focus:ring-[#10A37F] outline-none placeholder:text-gray-400 transition-shadow text-gray-900"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-[#10A37F] hover:bg-[#0E906F] text-white font-medium py-3.5 px-4 rounded-lg transition-colors mt-2"
          >
            Login
          </button>
        </form>

      </div>
    </div>
  );
}
