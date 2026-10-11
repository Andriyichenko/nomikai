import Image from "next/image";
import clsx from "clsx";
import Smoke from "./Smoke";

/**
 * The mascot (with the poster's own "集まれ！" lettering) lands in front of a vermilion seal in a puff of ninja smoke. The image box is
 * tagged `data-mascot-hero` so <MascotDock> can lift him out and shrink him into the corner
 * as the page scrolls.
 */
export default function HeroMascot({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  return (
    <div className={clsx("hero-zone relative aspect-[4/5] select-none", className)} aria-hidden>
      {/* seal */}
      <span className="absolute bottom-[6%] left-1/2 aspect-square w-[88%] -translate-x-1/2 rounded-full bg-accent" />
      <span className="absolute bottom-[6%] left-1/2 aspect-square w-[88%] -translate-x-[46%] translate-y-[3%] rounded-full border border-ink/70" />
      <span className="absolute bottom-[3%] left-1/2 h-[4%] w-[52%] -translate-x-1/2 rounded-[50%] bg-ink/15 blur-sm" />

      <div data-mascot-hero className="ninja-land absolute inset-x-[4%] bottom-[4%] top-0">
        <div className="float relative h-full w-full">
          <Image
            src="/mascot-v3.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 22rem, 40vw"
            className="object-contain object-bottom drop-shadow-[0_10px_20px_rgba(23,22,20,0.18)]"
          />
        </div>
      </div>
      <Smoke delay={0.45} scale={size === "lg" ? 1.6 : 0.8} className="top-[55%]" />

    </div>
  );
}
