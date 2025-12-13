"use client";

import Providers from "@/app/providers";
import ThemeProvider from "@/components/ThemeProvider";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenSplash");
    if (hasSeen) {
      setShowSplash(false);
    }
    setIsInitialized(true);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  if (!isInitialized) {
      // Return simple placeholder to prevent hydration mismatch or flash
      return <div className="min-h-screen bg-black" />;
  }

  return (
    <Providers>
        <ThemeProvider>
            {showSplash && <SplashScreen onAnimationComplete={handleSplashComplete} />}
            <div style={{ 
                visibility: showSplash ? 'hidden' : 'visible', 
                opacity: showSplash ? 0 : 1, 
                transition: 'opacity 0.5s ease-in' 
            }}>
                {children}
            </div>
        </ThemeProvider>
    </Providers>
  );
}