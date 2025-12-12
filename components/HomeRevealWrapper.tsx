"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function HomeRevealWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const maskRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap
      .timeline()
      .fromTo(
        maskRef.current,
        { clipPath: "polygon(48% 0,52% 0,60% 100%,56% 100%)" },
        {
          clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
          duration: 1.2,
          ease: "power3.out",
        }
      )
      .fromTo(contentRef.current, { x: -20 }, { x: 0, duration: 0.6, ease: "power2.out" }, "<");
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div ref={maskRef} className="absolute inset-0 z-10 bg-black pointer-events-none" />
      <div ref={contentRef} className="relative z-0">
        {children}
      </div>
    </div>
  );
}