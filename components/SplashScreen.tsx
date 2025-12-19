"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export default function SplashScreen({
  onAnimationComplete,
}: {
  onAnimationComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);
  const sakuraCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sakura Animation Logic
  const initSakura = () => {
    const canvas = sakuraCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const petals: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      rotation: number;
      rotationSpeed: number;
      oscillation: number;
    }> = [];

    // Create more petals for a lush effect
    for (let i = 0; i < 60; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        speed: Math.random() * 2 + 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        oscillation: Math.random() * 2,
      });
    }

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      petals.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.y * 0.01) * p.oscillation;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        
        // Draw petal
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, 0, 0, p.size);
        ctx.bezierCurveTo(-p.size, 0, -p.size / 2, -p.size / 2, 0, 0);
        ctx.fillStyle = "rgba(255, 220, 230, 0.8)";
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    // Initialize Sakura
    initSakura();

    const tl = gsap.timeline({
      onComplete: onAnimationComplete,
    });

    // Initial State
    gsap.set(containerRef.current, { opacity: 1 });
    gsap.set(slashRef.current, { scaleX: 0, opacity: 0 });
    gsap.set(logoRef.current, { opacity: 0, scale: 0.5, rotation: -10 });

    // 1. Slash Transition (0s - 1.5s)
    tl.to(slashRef.current, {
      scaleX: 1,
      opacity: 1,
      duration: 0.8,
      ease: "power4.out",
    })
    .to(slashRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
    }, "+=0.2");

    // 2. Background Gradient Pulse (Running concurrently)
    tl.to(containerRef.current, {
      background: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)", // Light Pink to Blue
      duration: 2,
      ease: "none",
    }, 0);

    // 3. Logo Appearance (1.5s - 3.5s)
    tl.to(logoRef.current, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 1.5,
      ease: "elastic.out(1, 0.5)",
    }, "-=0.5");

    // 4. Hold & Fade Out (3.5s - 5.0s)
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 1.0,
      ease: "power2.inOut",
    }, "+=1.0");

    // Total duration should be around 4-5s

    // Cleanup handles by React but nice to know
    return () => {
        tl.kill();
    };
  }, [onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500"
    >
      {/* Sakura Canvas */}
      <canvas
        ref={sakuraCanvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Slash Effect Element */}
      <div
        ref={slashRef}
        className="absolute w-[200%] h-32 bg-white blur-xl transform -rotate-45 origin-left z-20"
        style={{ top: "40%" }}
      />

      {/* Main Content */}
      <div ref={logoRef} className="relative z-30 flex flex-col items-center">
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
           <Image
            src="/my_logo.png"
            alt="Nomikai Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="mt-6 text-4xl sm:text-6xl font-black text-white tracking-widest drop-shadow-lg font-serif">
          バース人材! ❤️
        </h1>
      </div>
    </div>
  );
}