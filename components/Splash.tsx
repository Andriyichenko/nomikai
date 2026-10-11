"use client";

import { useEffect, useRef, useState } from "react";
import Tagline from "./Tagline";
import Smoke from "./Smoke";

const KEY = "nomikai:splash";
const IRIS_AT = 2950; // seal has flooded the screen by now
const IRIS_MS = 650;

/**
 * Opening sequence, once per browser session (tap anywhere to skip). Same composition as the
 * home hero, so it hands over seamlessly:
 *   0.1s  the vermilion seal stamps down and an ink ring draws around it
 *   0.55s the mascot drops into the seal — "ドロン" smoke at his feet
 *   1.1s  the slogan rises (same <Tagline> style as everywhere else)
 *   2.5s  the seal floods the screen red, then a shutter opens from its centre onto the page
 * Server-rendered so there is no flash of the page underneath; the inline script hides it
 * before first paint for visitors who have already seen it.
 */
export default function Splash({ line, caption, brand }: { line: string; caption: string; brand: string }) {
  const [state, setState] = useState<"show" | "leaving" | "gone">("show");
  const rootRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {}
    if (seen) {
      setState("gone");
      return;
    }
    const root = rootRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setState("gone"), 1800);
      return () => clearTimeout(t);
    }
    // Shutter: a transparent hole grows from the seal's centre (radius driven per frame,
    // so it works without CSS @property support).
    let raf = 0;
    const open = () => {
      const seal = sealRef.current?.getBoundingClientRect();
      const cx = seal ? seal.left + seal.width / 2 : window.innerWidth / 2;
      const cy = seal ? seal.top + seal.height / 2 : window.innerHeight / 2;
      const max = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 20;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / IRIS_MS);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const r = e * max;
        const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #000 ${r + 1}px)`;
        if (root) {
          root.style.maskImage = mask;
          root.style.webkitMaskImage = mask;
        }
        if (t < 1) raf = requestAnimationFrame(step);
        else setState("gone");
      };
      raf = requestAnimationFrame(step);
    };
    const t = setTimeout(open, IRIS_AT);
    const safety = setTimeout(() => setState("gone"), IRIS_AT + IRIS_MS + 400); // if rAF is throttled
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (state === "gone") return null;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${KEY}")==="1")document.documentElement.classList.add("splash-seen")}catch(e){}`,
        }}
      />
      <div
        ref={rootRef}
        role="presentation"
        onClick={() => {
          setState("leaving");
          setTimeout(() => setState("gone"), 350);
        }}
        className="splash fixed inset-0 z-[100] overflow-hidden bg-paper transition-opacity duration-300"
        style={{ opacity: state === "leaving" ? 0 : 1 }}
      >
        <p className="eyebrow fade-in absolute left-6 top-7 md:left-16 md:top-10">{brand}</p>

        <div className="mx-auto grid h-full max-w-6xl content-center items-center gap-8 px-6 md:grid-cols-[1fr_22rem] md:gap-10 md:px-8 lg:grid-cols-[1fr_24rem]">
          {/* slogan — left on desktop, under the seal on phones */}
          <div
            className="order-2 md:order-1"
            style={{ animation: "rise 0.9s cubic-bezier(0.2,0.7,0.2,1) 1.1s both, fade-out 0.25s ease 2.45s forwards" }}
          >
            <Tagline line={line} caption={caption} size="splash" />
          </div>

          {/* seal + mascot */}
          <div className="relative order-1 mx-auto aspect-[4/5] w-[min(64vw,19rem)] md:order-2 md:w-full">
            <span ref={sealRef} className="absolute bottom-[6%] left-1/2 aspect-square w-[88%] -translate-x-1/2">
              <span
                className="absolute inset-0 rounded-full bg-accent"
                style={{ animation: "seal-stamp 0.5s cubic-bezier(0.3,1.4,0.5,1) 0.1s both, seal-flood 0.55s cubic-bezier(0.7,0,0.3,1) 2.45s forwards" }}
              />
            </span>
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              className="absolute bottom-[6%] left-1/2 aspect-square w-[88%] -translate-x-[46%] translate-y-[3%] overflow-visible"
              style={{ animation: "fade-out 0.2s ease 2.45s forwards" }}
            >
              <circle
                cx="50"
                cy="50"
                r="49.5"
                fill="none"
                stroke="var(--ink)"
                strokeOpacity="0.7"
                strokeWidth="0.6"
                pathLength={1}
                strokeDasharray="1"
                style={{ animation: "ring-draw 0.9s cubic-bezier(0.6,0,0.3,1) 0.3s both", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div
              className="absolute inset-x-[4%] bottom-[4%] top-0"
              style={{ animation: "ninja-land 0.7s cubic-bezier(0.3,1.2,0.5,1) 0.55s both, fade-out 0.2s ease 2.45s forwards" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mascot-nosig-v3.webp" alt="" width={546} height={800} className="h-full w-full object-contain object-bottom" />
            </div>
            <span className="absolute inset-0" style={{ animation: "fade-out 0.2s ease 2.45s forwards" }}>
              <Smoke delay={0.95} scale={1.4} className="top-[58%]" />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
