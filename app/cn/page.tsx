"use client";

import BackgroundVideo from "@/components/BackgroundVideo";
import HeroSection from "@/components/HeroSection";

export default function HomeCN() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <BackgroundVideo />
      <HeroSection lang="cn" />
    </main>
  );
}
