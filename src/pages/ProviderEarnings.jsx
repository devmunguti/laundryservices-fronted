import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ProviderEarnings({ isStandalone = true, onNavigateTab }) {
  const navigate = useNavigate();
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 4000);
  };

  const mainContent = (
    <div className="flex flex-col w-full h-full items-center justify-center relative overflow-hidden py-8">
      {notified && (
        <div className="absolute top-0 px-4 py-3 bg-[#00a859]/10 border border-[#00a859]/30 text-[#00a859] rounded-2xl font-['Geist'] text-sm font-semibold flex items-center gap-2 z-50 animate-fadeIn">
          <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          <span>You will be notified as soon as Earnings Insights goes live!</span>
        </div>
      )}

      {/* Decorative Vector Blobs */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
        <svg className="absolute top-1/4 left-1/4 w-96 h-96 -ml-48 -mt-48 text-[#00c1fd]" viewBox="0 0 200 200">
          <path d="M47.7,-57.2C59.4,-48.1,64.9,-30.9,69.5,-13.2C74.1,4.5,77.8,22.7,69.9,35.7C62,48.7,42.5,56.5,23.3,64.4C4.1,72.3,-14.8,80.3,-30.7,76C-46.6,71.7,-59.5,55.1,-67.2,37.3C-74.9,19.5,-77.4,0.5,-73.4,-17.1C-69.4,-34.7,-58.9,-50.9,-44.7,-59.6C-30.5,-68.3,-15.2,-69.5,1.1,-70.8C17.4,-72.1,34.9,-73.5,47.7,-57.2Z" fill="currentColor" transform="translate(100 100) scale(1.2)"></path>
        </svg>
        <svg className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] -mr-64 -mb-64 text-[#b7c4ff]" viewBox="0 0 200 200">
          <path d="M51.9,-61.8C64.4,-51.9,69.8,-32.8,70.5,-14.4C71.2,4,67.2,21.7,58,36C48.8,50.3,34.4,61.2,17.4,66.8C0.4,72.4,-19.2,72.7,-35.1,65.3C-51,57.9,-63.2,42.8,-71.2,25.2C-79.2,7.6,-83,-12.5,-76.3,-29C-69.6,-45.5,-52.4,-58.4,-36.1,-66.2C-19.8,-74,-4.5,-76.7,11,-73.7C26.5,-70.7,40.5,-63.7,51.9,-61.8Z" fill="currentColor" transform="translate(100 100) scale(1)"></path>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl text-center px-4 py-8">
        {/* Animated Icon Card */}
        <div className="relative w-32 h-32 mb-8 animate-[bounce_3s_ease-in-out_infinite]">
          <div className="absolute inset-0 bg-[#0052ff] rounded-3xl rotate-6 opacity-20 blur-xl"></div>
          <div className="absolute inset-0 bg-[#e2e2e5] rounded-3xl rotate-12 opacity-40 shadow-xs"></div>
          <div className="relative w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-md border border-[#c3c5d9]/20">
            <span className="material-symbols-outlined text-[64px] text-[#003ec7]" style={{ fontVariationSettings: "'FILL' 1" }}>
              monitoring
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c2e8ff]/50 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006688] animate-pulse"></span>
            <span className="font-['Geist'] text-xs font-semibold text-[#001e2b]">In Development</span>
          </div>
          
          <h1 className="font-['Geist'] text-3xl md:text-5xl font-bold text-[#1a1c1e] tracking-tight">
            Earnings Insights <span className="text-[#0052ff]">Coming Soon</span>
          </h1>

          <p className="font-['Inter'] text-base text-[#434656] max-w-xl mx-auto leading-relaxed">
            We are building a powerful financial dashboard to help you track your revenue, analyze performance trends, and manage payouts with ease. Get ready to take control of your financial growth.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center w-full justify-center">
          <button 
            onClick={() => onNavigateTab ? onNavigateTab('dashboard') : navigate('/provider/dashboard')}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#003ec7] text-white font-['Geist'] text-sm font-semibold rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </button>

          <button 
            onClick={handleNotifyMe}
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-[#003ec7] text-[#003ec7] font-['Geist'] text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#003ec7]/10 transition-colors duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span>Notify Me When Live</span>
          </button>
        </div>

        <div className="mt-14 w-full max-w-md">
          <div className="h-2.5 w-full bg-[#eeeef0] rounded-full overflow-hidden">
            <div className="h-full bg-[#0052ff] rounded-full w-3/4 transition-all duration-1000"></div>
          </div>
          <p className="mt-3 font-['Geist'] text-xs font-semibold text-[#737688] uppercase tracking-wider">75% Complete</p>
        </div>
      </div>
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
