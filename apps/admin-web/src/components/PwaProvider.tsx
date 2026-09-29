'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA ServiceWorker registration failed:', err);
          });
      });
    }

    // Catch browser install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if user has not dismissed it recently
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {children}

      {/* Floating Mobile PWA Install Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white border border-[#0078d4]/30 rounded-[8px] p-4 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md bg-white/95">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-[8px] bg-[#051329] overflow-hidden shrink-0 border border-[#0078d4]/40 shadow-sm p-[1px]">
              <img
                src="/icons/icon-192.png"
                alt="Store Admin App"
                className="h-full w-full object-cover rounded-[7px]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#201f1e]">Install Store Admin App</h4>
              <p className="text-xs text-[#605e5c] mt-0.5">
                Install as a mobile app on your home screen for quick access and instant order alerts.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-[#0078d4] text-white hover:bg-[#106ebe] text-xs font-semibold rounded-[4px] shadow-xs transition"
                >
                  Install App
                </button>
                <button
                  onClick={dismissBanner}
                  className="px-3 py-1.5 bg-[#f3f2f1] text-[#605e5c] hover:bg-[#edebe9] text-xs font-medium rounded-[4px] transition"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="text-[#a19f9d] hover:text-[#201f1e] p-1 rounded-[4px]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
