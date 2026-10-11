import clsx from "clsx";

/* eslint-disable @next/next/no-img-element -- avatars come from arbitrary OAuth hosts */
export default function Avatar({
  name,
  src,
  size = 28,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name || "?").trim().slice(0, 1).toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={clsx("shrink-0 rounded-full object-cover ring-2 ring-paper", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      title={name}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-paper-2 font-serif text-ink-2 ring-2 ring-paper",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

export function AvatarStack({ people, max = 6 }: { people: { name: string; avatar: string | null }[]; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          <Avatar key={`${p.name}-${i}`} name={p.name} src={p.avatar} size={24} />
        ))}
      </div>
      {rest > 0 && <span className="ml-2 text-xs text-muted">+{rest}</span>}
    </div>
  );
}
