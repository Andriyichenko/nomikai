"use client";

import { useEffect, useState } from "react";
import Tagline from "./Tagline";
import Smoke from "./Smoke";

const KEY = "nomikai:splash";
const LEAVE_AT = 3500;

/**
 * Opening sequence, once per browser session (tap anywhere to skip):
 *   1. the brand glitches in, in the mascot poster's crimson double-offset lettering
 *   2. the slogan rises (same <Tagline> style as everywhere else)
 *   3. the mascot pushes his pallet jack along the bottom line — the line he draws is the
 *      progress bar (his poster lettering shouts "集まれ！"), then vanishes ninja-style ("ドロン！") in a puff of smoke.
 * Server-rendered so there is no flash of the page underneath; the inline script hides it
 * before first paint for visitors who have already seen it.
 */
export default function Splash({ line, caption, brand }: { line: string; caption: string; brand: string }) {
  const [state, setState] = useState<"show" | "leaving" | "gone">("show");

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
    const t1 = setTimeout(() => setState("leaving"), LEAVE_AT);
    const t2 = setTimeout(() => setState("gone"), LEAVE_AT + 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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
        role="presentation"
        onClick={() => {
          setState("leaving");
          setTimeout(() => setState("gone"), 500);
        }}
        className="splash fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-paper px-6 pb-10 pt-8 transition-opacity duration-500 md:px-16 md:pb-14 md:pt-12"
        style={{ opacity: state === "leaving" ? 0 : 1 }}
      >
        <p className="glitch glitch-in text-2xl md:text-4xl">{brand}</p>

        <div className="rise" style={{ animationDelay: "0.45s", animationDuration: "1.1s" }}>
          <Tagline line={line} caption={caption} size="splash" />
        </div>

        {/* track: the ink line grows to the right and the mascot rides its tip */}
        <div className="relative h-32 md:h-52">
          <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-ink"
            style={{ animation: "ride-track 2.6s cubic-bezier(0.45, 0.05, 0.4, 1) 0.15s both" }}
          >
            {/* ninja exit: "ドロン！" — a puff of smoke where he stood */}
            <div className="absolute bottom-0 right-0 h-28 w-28 translate-x-[35%] md:h-48 md:w-48">
              <Smoke delay={2.75} scale={1.5} className="top-[40%]" />
              <span
                className="pop glitch absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-lg md:text-2xl"
                style={{ animationDelay: "2.85s" }}
              >
                ドロン！
              </span>
            </div>
            <div
              className="absolute bottom-0 right-0 translate-x-[35%]"
              style={{ animation: "vanish 0.3s ease-in 2.75s both" }}
            >
              {/* speed lines */}
              {[0.35, 0.6, 0.82].map((y, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="speed-line absolute -left-3 h-[2px] w-8 origin-right rounded-full bg-ink/60"
                  style={{ top: `${y * 100}%`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mascot-sm-v3.webp"
                alt=""
                width={260}
                height={360}
                className="ride-bump block h-32 w-auto md:h-52"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
