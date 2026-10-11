/* eslint-disable @next/next/no-img-element -- logos come from arbitrary shop/CDN hosts */
import type { Shop } from "@/lib/types";

/** Round logo; falls back to the first character of the name set in Mincho. */
export default function ShopLogo({ shop, size = 48 }: { shop: Pick<Shop, "name" | "logo_url">; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-card ring-4 ring-card"
      style={{ width: size, height: size }}
    >
      {shop.logo_url ? (
        <img src={shop.logo_url} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
      ) : (
        <span className="font-serif font-bold text-ink" style={{ fontSize: size * 0.42 }}>
          {shop.name.trim().slice(0, 1)}
        </span>
      )}
    </span>
  );
}
