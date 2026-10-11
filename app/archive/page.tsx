import Image from "next/image";
import clsx from "clsx";
import { getArchive } from "@/lib/data";
import { getDict } from "@/lib/lang";
import { paletteAt } from "@/lib/palette";

export const metadata = { title: "Archive" };

const dot = (d: string | null) => (d ? d.replace(/-/g, ".") : "");

/** One wall per gathering, each in its own traditional colour: offset mats, vertical captions, full-colour prints. */
export default async function ArchivePage() {
  const [{ t }, entries] = await Promise.all([getDict(), getArchive()]);
  return (
    <div className="relative -mb-24 overflow-hidden bg-[#efe6d6] pb-32 text-[#1b1a17] dark:bg-[#1d1b17] dark:text-[#efebe3]">
      <span aria-hidden className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-[#e0a526]/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-32 top-[40rem] h-[30rem] w-[30rem] rounded-full bg-[#2b4c7e]/12 blur-3xl" />

      <header className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:px-8 md:pb-24 md:pt-28">
        <p className="font-display text-sm uppercase tracking-[0.35em] text-[#c23a2b]">Archive</p>
        <h1 className="mt-4 font-serif text-4xl font-bold tracking-[0.14em] md:text-6xl">{t.home.archive}</h1>
        <p className="mt-4 font-display text-xl italic opacity-60">{t.home.archiveLead}</p>
      </header>

      <div className="relative mx-auto max-w-6xl space-y-28 px-4 md:space-y-40 md:px-8">
        {entries.map((e, i) => {
          const c = paletteAt(i);
          const no = String(entries.length - i).padStart(2, "0");
          const flip = i % 2 === 1;
          return (
            <section key={e.id} id={e.id} className="scroll-mt-24">
              <div className={clsx("grid gap-10 md:grid-cols-[1fr_15rem] md:gap-14", flip && "md:grid-cols-[15rem_1fr]")}>
                <div className={clsx("relative", flip && "md:order-2")}>
                  <span aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 md:translate-x-5 md:translate-y-5" style={{ background: c.bg }} />
                  {e.images.length > 0 ? (
                    <div className="relative grid grid-cols-6 gap-1.5 bg-white p-1.5 shadow-[0_24px_50px_-28px_rgba(27,26,23,0.55)] md:gap-2 md:p-2">
                      {e.images.slice(0, 5).map((src, j) => (
                        <figure
                          key={src}
                          className={clsx(
                            "group relative overflow-hidden bg-[#e9e2d4]",
                            j === 0 || e.images.length === 2 ? "col-span-6 aspect-[16/10]" : "col-span-3 aspect-[4/3]",
                          )}
                        >
                          <Image
                            src={src}
                            alt={`${e.title} ${j + 1}`}
                            fill
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover saturate-[1.08] transition duration-700 group-hover:scale-[1.03]"
                          />
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <div className="relative flex aspect-[16/10] items-center justify-center" style={{ background: c.bg, color: c.ink }}>
                      <span className="font-serif text-[10rem] font-bold leading-none opacity-90 md:text-[14rem]">{e.title.trim().slice(0, 1)}</span>
                    </div>
                  )}
                </div>

                <div className={clsx("flex gap-6 md:flex-col md:gap-8", flip && "md:order-1")}>
                  <h2
                    className="shrink-0 self-start px-2 py-4 font-serif text-2xl font-bold tracking-[0.3em] [writing-mode:vertical-rl] md:text-3xl"
                    style={{ background: c.bg, color: c.ink }}
                  >
                    {e.title}
                  </h2>
                  <div className="min-w-0">
                    <p className="font-display text-6xl leading-none md:text-7xl" style={{ color: c.bg }}>
                      {no}
                    </p>
                    <p className="mt-4 font-display text-2xl tracking-wider">{dot(e.held_on)}</p>
                    {e.place && <p className="mt-1 text-sm opacity-60">{e.place}</p>}
                    {e.body && <p className="mt-5 whitespace-pre-line text-sm leading-loose opacity-80">{e.body}</p>}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
