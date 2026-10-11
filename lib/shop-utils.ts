import type { Shop } from "./types";

export function mapUrl(shop: Pick<Shop, "lat" | "lng" | "address" | "name">) {
  const q = shop.lat && shop.lng ? `${shop.lat},${shop.lng}` : `${shop.name} ${shop.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export const SOURCE_LABEL: Record<Shop["source"], string> = {
  tabelog: "食べログ",
  hotpepper: "ホットペッパー",
  manual: "",
  other: "Web",
};
