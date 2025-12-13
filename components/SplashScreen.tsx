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

  const slashLeftRef = useRef<HTMLDivElement>(null);
  const slashRightRef = useRef<HTMLDivElement>(null);

  const textLeftTopRef = useRef<HTMLDivElement>(null);
  const textLeftBottomRef = useRef<HTMLDivElement>(null);
  const textRightLeftRef = useRef<HTMLDivElement>(null);  // 左半部分
  const textRightRightRef = useRef<HTMLDivElement>(null); // 右半部分

  const logoRef = useRef<HTMLDivElement>(null);
  const sakuraCanvasRef = useRef<HTMLCanvasElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);

  const spawnDust = (side: "left" | "right") => {
    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const xBase = side === "left" ? w * 0.35 : w * 0.65;

    for (let i = 0; i < 80; i++) {
      const x = xBase + (Math.random() - 0.5) * w * 0.15;
      const y = h * 0.3 + Math.random() * h * 0.4;
      const r = Math.random() * 1.8;

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    gsap.to(canvas, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => ctx.clearRect(0, 0, w, h),
    });
  };

  const spawnSakura = () => {
    const canvas = sakuraCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const petals: Array<{
      x: number;
      y: number;
      rotation: number;
      speed: number;
      swing: number;
    }> = [];

    for (let i = 0; i < 25; i++) {
      petals.push({
        x: w * 0.3 + Math.random() * w * 0.4,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
        swing: Math.random() * 40 - 20,
      });
    }

    const drawPetal = (x: number, y: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = "rgba(255, 182, 193, 0.6)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    let frame = 0;
    const animate = () => {
      if (frame > 180) return; // 3秒后停止
      ctx.clearRect(0, 0, w, h);

      petals.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(frame * 0.05) * 0.3;
        p.rotation += 0.02;
        drawPetal(p.x, p.y, p.rotation);
      });

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    const dustCanvas = dustCanvasRef.current;
    const sakuraCanvas = sakuraCanvasRef.current;
    if (dustCanvas) {
      dustCanvas.width = window.innerWidth;
      dustCanvas.height = window.innerHeight;
    }
    if (sakuraCanvas) {
      sakuraCanvas.width = window.innerWidth;
      sakuraCanvas.height = window.innerHeight;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: onAnimationComplete,
    });

    tl.set(containerRef.current, { opacity: 1 }).to({}, { duration: 0.5 });

    /* ===== 第一刀：向左（\ 方向） ===== */
    tl.fromTo(
      slashLeftRef.current,
      { opacity: 0, xPercent: 20 },
      { opacity: 1, xPercent: 0, duration: 0.25 }
    )
      .to([textLeftTopRef.current, textLeftBottomRef.current], { opacity: 1, duration: 0 }, "<")
      .to(
        textLeftTopRef.current,
        {
          clipPath: "polygon(0 0,100% 0,100% 45%,0 60%)",
          x: -10,
          y: -8,
          duration: 0.35,
        },
        "<"
      )
      .to(
        textLeftBottomRef.current,
        {
          clipPath: "polygon(0 60%,100% 45%,100% 100%,0 100%)",
          x: 8,
          y: 12,
          duration: 0.25,
          ease: "power3.out",
        },
        "<"
      )
      .add(() => spawnDust("left"), "<")
      .to(containerRef.current, { x: -5, y: 3, duration: 0.05, yoyo: true, repeat: 2 }, "<")
      .to(slashLeftRef.current, { opacity: 0, duration: 0.3 });

    tl.to({}, { duration: 0.6 });

    /* ===== 第二刀：向右（/ 方向）✅ 切印修正 ===== */
    tl.fromTo(
      slashRightRef.current,
      { opacity: 0, xPercent: -20 },
      { opacity: 1, xPercent: 0, duration: 0.25 }
    )
      .to([textRightLeftRef.current, textRightRightRef.current], { opacity: 1, duration: 0 }, "<")
      .to(
        textRightLeftRef.current,
        {
          clipPath: "polygon(0 0, 100% 0, 0 100%)",  // ✅ Upper Left Half
          x: -15,
          y: -15,  // Move Up-Left
          duration: 0.4,
          ease: "power2.out",
        },
        "<"
      )
      .to(
        textRightRightRef.current,
        {
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",  // ✅ Lower Right Half
          x: 15,
          y: 15,  // Move Down-Right
          duration: 0.4,
          ease: "power2.out",
        },
        "<"
      )
      .add(() => spawnDust("right"), "<")
      .to(containerRef.current, { x: 5, y: -3, duration: 0.05, yoyo: true, repeat: 2 }, "<")
      .to(slashRightRef.current, { opacity: 0, duration: 0.3 });

    tl.to({}, { duration: 0.5 });

    /* ===== Logo 武士风浮现 + 樱花 ===== */
    tl.add(spawnSakura)
      .fromTo(
        logoRef.current,
        {
          opacity: 0,
          y: 30,
          scale: 0.9,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.5,
          ease: "power3.out",
        },
        "<"
      );

    tl.to(containerRef.current, { opacity: 0, duration: 0.5 }, "+=0.4");
  }, [onAnimationComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col items-center justify-center">
      <div
        ref={slashLeftRef}
        className="pointer-events-none absolute inset-[-40%] opacity-0"
        style={{
          background: "linear-gradient(135deg, transparent 46%, white 50%, transparent 54%)",
        }}
      />

      <div
        ref={slashRightRef}
        className="pointer-events-none absolute inset-[-40%] opacity-0"
        style={{
          background: "linear-gradient(45deg, transparent 46%, white 50%, transparent 54%)",
        }}
      />

      <canvas ref={dustCanvasRef} className="absolute inset-0 pointer-events-none opacity-100" />
      <canvas ref={sakuraCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Logo Area (Top) */}
      <div ref={logoRef} className="absolute top-[15%] opacity-0 z-10">
        <div
          className="relative"
          style={{
            filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
          }}
        >
          {/* Ensure correct logo is used. Using standard path. */}
          <Image src="/my_logo.png" alt="Logo" width={180} height={180} className="object-contain" />
        </div>
      </div>

      {/* Text Area (Centered/Lower) */}
      <div className="relative w-full h-full max-w-4xl mx-auto pointer-events-none">
          {/* 左侧文字 */}
          <div className="absolute left-[25%] md:left-[30%] top-[45%]">
            <div
              ref={textLeftTopRef}
              className="writing-mode-vertical-rl font-yuji-syuku text-5xl md:text-6xl tracking-[0.35em] absolute text-white opacity-0"
            >
              バース人材
            </div>
            <div
              ref={textLeftBottomRef}
              className="writing-mode-vertical-rl font-yuji-syuku text-5xl md:text-6xl tracking-[0.35em] absolute text-white opacity-0"
            >
              バース人材
            </div>
          </div>

          {/* 右侧文字（/ 切开） */}
          <div className="absolute right-[25%] md:right-[30%] top-[45%]">
            <div
              ref={textRightLeftRef}
              className="writing-mode-vertical-rl font-yuji-syuku text-6xl md:text-8xl tracking-[0.25em] absolute text-red-500 opacity-0"
              style={{ textShadow: "0 0 24px rgba(239, 68, 68, 0.6)" }}
            >
              頑張れ
            </div>
            <div
              ref={textRightRightRef}
              className="writing-mode-vertical-rl font-yuji-syuku text-6xl md:text-8xl tracking-[0.25em] absolute text-red-500 opacity-0"
              style={{ textShadow: "0 0 24px rgba(239, 68, 68, 0.6)" }}
            >
              頑張れ
            </div>
          </div>
      </div>
    </div>
  );
}