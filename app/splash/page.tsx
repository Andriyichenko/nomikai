"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility for tailwind

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0); // 0: initial, 1: logo, 2: ganbare, 3: fade to home

  useEffect(() => {
    // Phase 1: Show Logo
    const logoTimer = setTimeout(() => {
      setPhase(1);
    }, 500); // Small delay before logo appears

    // Phase 2: Show Ganbare
    const ganbareTimer = setTimeout(() => {
      setPhase(2);
    }, 2000); // Logo visible for 1.5s then Ganbare appears

    // Phase 3: Fade out and redirect
    const redirectTimer = setTimeout(() => {
      setPhase(3);
      setTimeout(() => {
        router.push("/"); // Redirect to home page
      }, 1500); // Allow fade-out animation to complete
    }, 4500); // Ganbare visible for 2.5s then fade out starts

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(ganbareTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Logo Phase */}
      <div
        className={cn(
          "absolute transition-all duration-1000 ease-in-out",
          phase === 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}
      >
        <Image
          src="/my_logo.png"
          alt="Logo"
          width={250}
          height={150}
          priority
          className="filter drop-shadow-lg"
        />
      </div>

      {/* Ganbare Phase */}
      <div
        className={cn(
          "absolute font-yuji-syuku text-white text-7xl md:text-9xl tracking-wider filter drop-shadow-2xl transition-opacity duration-1000 ease-in-out",
          phase === 2 ? "opacity-100" : "opacity-0"
        )}
        style={{ textShadow: '0 0 15px rgba(255,255,255,0.7), 0 0 50px rgba(255,255,255,0.5)' }} // Subtle glow
      >
        頑張れ！
      </div>

      {/* Global Fade-out */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-1500 ease-out",
          phase === 3 ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
}
