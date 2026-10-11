"use client";

import { useEffect } from "react";

/**
 * Marks history navigations (back / forward, including the mobile swipe-back gesture) with
 * `html.nav-pop` for a moment, so globals.css can skip entrance animations and the restored
 * page simply appears where the browser's snapshot left it, instead of re-animating.
 */
export default function NavMotion() {
  useEffect(() => {
    const root = document.documentElement;
    let timer = 0;
    const onPop = () => {
      root.classList.add("nav-pop");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.classList.remove("nav-pop"), 1200);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(timer);
      root.classList.remove("nav-pop");
    };
  }, []);
  return null;
}
