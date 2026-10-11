import clsx from "clsx";

/**
 * The single typographic treatment for every slogan (splash, home hero, admin preview),
 * so changing the words never changes the look.
 */
export default function Tagline({
  line,
  caption,
  size = "hero",
  className,
}: {
  line: string;
  caption?: string;
  size?: "splash" | "hero" | "preview";
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col items-start", className)}>
      <span
        aria-hidden
        className={clsx("mb-6 block bg-accent", size === "preview" ? "h-2 w-2" : "h-3 w-3")}
      />
      <p
        className={clsx(
          "font-serif font-bold leading-[1.35] tracking-[0.06em] whitespace-pre-line text-ink [text-wrap:balance]",
          size === "splash" && "text-[clamp(2rem,7vw,4.5rem)]",
          size === "hero" && "text-[clamp(2rem,6vw,4rem)]",
          size === "preview" && "text-2xl",
        )}
      >
        {line}
      </p>
      {caption ? (
        <p
          className={clsx(
            "mt-5 whitespace-pre-line text-ink-2 tracking-[0.08em]",
            size === "preview" ? "text-xs" : "text-sm md:text-base",
          )}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
