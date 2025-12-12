"use client";

import BackgroundVideo from "@/components/BackgroundVideo";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <BackgroundVideo />
      <HeroSection lang="ja" />
    </main>
  );
}