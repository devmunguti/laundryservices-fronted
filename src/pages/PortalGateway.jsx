import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PortalGateway() {
  const navigate = useNavigate();

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex items-center justify-center">
      <main className="flex flex-col w-full min-h-[calc(100vh-80px)] items-center justify-center p-container-padding-mobile md:p-container-padding-desktop relative overflow-hidden bg-background">
        {/* Ambient Background Blur */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-fixed-dim/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-4xl z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_laundry_service
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-background mb-4">
              Aura Laundry Portal
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto">
              Select your access level to manage operations, view analytics, and control the silent service engine.
            </p>
          </div>

          {/* Bento Grid for Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
            {/* Service Provider Card */}
            <div className="group relative bg-surface-container-lowest rounded-[16px] p-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(26,115,232,0.08)] transition-all duration-300 flex flex-col h-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary-fixed-dim to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">
                    storefront
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-background mb-3">
                  Service Provider
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 line-clamp-3">
                  Access your facility dashboard. Manage active laundry orders, track pickup schedules, and update machine availability in real-time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/provider')}
                className="w-full h-12 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded flex items-center justify-center gap-2 transition-colors border border-outline-variant/30 group-hover:border-secondary/30"
              >
                <span>Login to Facility</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Platform Admin Card */}
            <div className="group relative bg-surface-container-lowest rounded-[16px] p-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(26,115,232,0.08)] transition-all duration-300 flex flex-col h-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                    admin_panel_settings
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-background mb-3">
                  Platform Admin
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 line-clamp-3">
                  Enter the central command center. Monitor network performance, resolve escalated customer queries, and analyze system-wide telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="w-full h-12 bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md rounded flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
              >
                <span>Access Command</span>
                <span className="material-symbols-outlined text-sm">login</span>
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-12 text-center">
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors mx-4"
              href="#privacy"
              onClick={(e) => e.preventDefault()}
            >
              Privacy Policy
            </a>
            <span className="text-outline-variant">•</span>
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors mx-4"
              href="#status"
              onClick={(e) => e.preventDefault()}
            >
              System Status
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
