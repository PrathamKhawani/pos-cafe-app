import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import ScrollProvider from '@/frontend/components/shared/ScrollProvider';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Cafe POS — Enterprise',
  description: 'Professional Restaurant Point of Sale System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen`}
            style={{ background: '#F5F3EF', color: '#1A120B' }}>
        <ScrollProvider>
          <div className="relative w-full min-h-screen flex flex-col">
            {children}
          </div>
        </ScrollProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#1A120B',
              border: '1px solid #E5DDD3',
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#2D7A4F', secondary: '#EBF7F1' } },
            error:   { iconTheme: { primary: '#C0392B', secondary: '#FDECEA' } },
          }}
        />
      </body>
    </html>
  );
}
