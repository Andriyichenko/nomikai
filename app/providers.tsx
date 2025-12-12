"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast"; // Import Toaster

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          className: 'font-sans text-sm',
          style: {
            border: '1px solid #e2e8f0',
            padding: '12px',
            color: '#333',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#16a34a', // Green
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#dc2626', // Red
              secondary: '#fff',
            },
          },
        }}
      />
    </SessionProvider>
  );
}