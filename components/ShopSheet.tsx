"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, MapPin, Star, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Shop } from "@/lib/types";
import ShopLogo from "./ShopLogo";
import { SOURCE_LABEL, mapUrl } from "@/lib/shop-utils";

/** Full shop details in a native <dialog>: bottom sheet on phones, centered panel on desktop. */
export default function ShopSheet({
  shop,
  t,
  onClose,
  footer,
}: {
  shop: Shop | null;
  t: Dict["event"];
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (shop && !d.open) d.showModal();
    if (!shop && d.open) d.close();
  }, [shop]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-card p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm md:m-auto md:max-h-[88dvh] md:max-w-2xl md:rounded-3xl"
    >
      {shop && (
        <div className="flex max-h-[92dvh] flex-col md:max-h-[88dvh]">
          <div className="relative z-10 shrink-0">
            {shop.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.cover_url} alt="" className="h-44 w-full object-cover md:h-56" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-24 w-full bg-paper-2" />
            )}
            <div className="absolute -bottom-7 left-5 md:left-8">
              <ShopLogo shop={shop} size={64} />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-ink backdrop-blur"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain px-5 pb-6 pt-3 md:px-8">
            <p className="pl-[76px] text-xs text-muted">{shop.genre}&nbsp;</p>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-snug tracking-wide">{shop.name}</h2>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {shop.rating != null && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Star size={14} className="fill-accent text-accent" />
                  {Number(shop.rating).toFixed(2)}
                  {shop.review_count != null && <span className="text-muted">（{t.reviewsCount(shop.review_count)}）</span>}
                </span>
              )}
              {shop.budget && <span className="chip">{shop.budget}</span>}
            </div>

            {shop.summary && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-2">{shop.summary}</p>}

            {(shop.photos ?? []).length > 0 && (
              <section className="mt-6">
                <h3 className="eyebrow mb-3">Photos — {t.photos}</h3>
                <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 md:-mx-8 md:px-8">
                  {shop.photos.map((src, i) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="relative aspect-square w-36 shrink-0 snap-start overflow-hidden rounded-xl bg-paper-2 md:w-40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${shop.name} ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    </a>
                  ))}
                </div>
                {shop.source !== "manual" && <p className="mt-1.5 text-[10px] text-muted">© {SOURCE_LABEL[shop.source]}</p>}
              </section>
            )}

            <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
              {shop.address && (
                <Row label={t.address}>
                  <a href={mapUrl(shop)} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 underline decoration-line underline-offset-4 hover:decoration-ink">
                    <MapPin size={14} className="mt-1 shrink-0" />
                    {shop.address}
                  </a>
                </Row>
              )}
              {shop.access && <Row label={t.access}>{shop.access}</Row>}
              {shop.hours && <Row label={t.hours}><span className="whitespace-pre-line">{shop.hours}</span></Row>}
              {shop.phone && <Row label="TEL"><a href={`tel:${shop.phone}`}>{shop.phone}</a></Row>}
            </dl>

            {shop.menu.length > 0 && (
              <section className="mt-8">
                <h3 className="eyebrow mb-3">Menu — {t.menu}</h3>
                <ul className="space-y-2.5">
                  {shop.menu.map((m, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0">
                          {m.note === "コース" && <span className="mr-1.5 rounded bg-accent px-1.5 py-px text-[10px] text-accent-ink">COURSE</span>}
                          {m.name}
                        </span>
                        <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-line" />
                        <span className="shrink-0 tabular-nums">{m.price}</span>
                      </div>
                      {m.note && m.note !== "コース" && <p className="mt-0.5 text-xs text-muted">{m.note}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {shop.reviews.length > 0 && (
              <section className="mt-8">
                <h3 className="eyebrow mb-3">Voices — {t.reviews}</h3>
                <ul className="space-y-4">
                  {shop.reviews.map((r, i) => (
                    <li key={i} className="border-l-2 border-accent pl-4">
                      <p className="text-sm leading-relaxed text-ink-2">{r.body}</p>
                      <p className="mt-1 text-xs text-muted">
                        — {r.author}
                        {r.rating != null && ` ・ ★${r.rating}`}
                        {r.date && ` ・ ${r.date}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {shop.source_url && (
              <a
                href={shop.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
              >
                {t.source}: {SOURCE_LABEL[shop.source] || shop.source_url} <ExternalLink size={12} />
              </a>
            )}
          </div>

          {footer && <div className="shrink-0 border-t border-line bg-card px-5 py-3 md:px-8">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-ink-2">{children}</dd>
    </div>
  );
}
