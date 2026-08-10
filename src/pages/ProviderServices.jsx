import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ProviderServices({ isStandalone = true, onNavigateTab }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const mainContent = (
    <div className="flex flex-col w-full h-full items-center justify-center font-['Inter'] text-[#1a1c1e] py-6">
      <div className="max-w-2xl w-full text-center flex flex-col items-center">
        {/* Animated Illustration Area */}
        <div className="relative w-64 h-64 mb-6 flex items-center justify-center group">
          <div className="absolute inset-0 bg-[#0052ff]/10 rounded-full blur-3xl group-hover:bg-[#0052ff]/20 transition-colors duration-700"></div>
          <div className="relative w-48 h-48 rounded-full bg-[#eeeef0] flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
            <img 
              className="w-full h-full object-cover mix-blend-multiply" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ5XlvNL4xr7dOqdgc9S9zyURitri7KGVKE80JLJPHUlppFcwMk-16rZYvBvvJRwWGb5xalGGWrr_rHdqTr_Jrwnp1p9Ie1AM0INBUxDa785HdqOCz_SuzryQ1PTUlNGvbqePKILO1FBrIxm2rVSAGLdGroWvwWi2j51-LYeYmE2a_IuD808LZOw5Vm-9L9nfHKtQ1aJXmLBNgoy2UCiGe3FBxF5NmUdLN4LSE-gHAqC0j-bOFFLO75w" 
              alt="Services Management Illustration"
            />
          </div>

          {/* Floating accent icons */}
          <div className="absolute top-4 right-8 bg-white p-3 rounded-full shadow-md animate-bounce">
            <span className="material-symbols-outlined text-[#003ec7] text-[28px]">build_circle</span>
          </div>
          <div className="absolute bottom-8 left-4 bg-white p-2.5 rounded-full shadow-xs animate-bounce" style={{ animationDelay: '1s' }}>
            <span className="material-symbols-outlined text-[#006688] text-[22px]">local_laundry_service</span>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4 max-w-lg mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f3f3f6] text-[#434656]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#003ec7] animate-pulse"></span>
            <span className="font-['Geist'] text-xs uppercase tracking-wider font-semibold text-[#003ec7]">In Development</span>
          </div>

          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">
            Services Management <br />
            <span className="text-[#003ec7]">Coming Soon</span>
          </h1>

          <p className="font-['Inter'] text-base text-[#434656] leading-relaxed">
            We are building a comprehensive suite to help you manage your laundry services, pricing, and turnaround times with precision. Stay tuned for updates!
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
          <button 
            onClick={() => onNavigateTab ? onNavigateTab('dashboard') : navigate('/provider/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#eeeef0] hover:bg-[#e8e8ea] transition-colors text-[#1a1c1e] font-['Geist'] text-sm font-semibold group cursor-pointer"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span>Back to Dashboard</span>
          </button>

          <button 
            onClick={() => onNavigateTab ? onNavigateTab('dashboard') : navigate('/provider/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#003ec7] hover:bg-[#0038b6] transition-colors text-white font-['Geist'] text-sm font-semibold shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Progress indicator visual */}
        <div className="mt-14 w-full max-w-sm">
          <div className="flex justify-between font-['Geist'] text-xs text-[#434656] font-semibold mb-2">
            <span>Development Progress</span>
            <span className="text-[#003ec7]">75%</span>
          </div>
          <div className="h-2.5 w-full bg-[#e8e8ea] rounded-full overflow-hidden">
            <div className="h-full bg-[#003ec7] rounded-full w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
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
