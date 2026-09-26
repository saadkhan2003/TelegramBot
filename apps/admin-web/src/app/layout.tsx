import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileBottomBar from '../components/MobileBottomBar';
import PwaProvider from '../components/PwaProvider';
import { NavigationProvider } from '../context/NavigationContext';

export const viewport: Viewport = {
  themeColor: '#0078d4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Delux Store — Admin Control Panel',
  description: 'Enterprise Telegram Digital Store Admin Control Panel & Ledger',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Delux Store',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-[#f3f2f1] text-[#201f1e] min-h-screen font-sans antialiased selection:bg-[#0078d4]/10 selection:text-[#0078d4]">
        <NavigationProvider>
          <PwaProvider>
            <div className="flex min-h-screen w-full relative">
              <Sidebar />
              <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full pb-16 lg:pb-0">
                <Header />
                <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto">
                  {children}
                </main>
              </div>
              <MobileBottomBar />
            </div>
          </PwaProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
