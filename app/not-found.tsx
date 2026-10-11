import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 pt-16 text-center md:pt-24">
      <div className="relative h-56 w-40">
        <Image src="/mascot-v3.webp" alt="" fill sizes="10rem" className="float object-contain" />
      </div>
      <p className="glitch mt-6 text-6xl">404</p>
      <p className="mt-6 text-ink-2">この先は、まだ配達ルートにありません。</p>
      <Link href="/" className="btn btn-primary mt-8">トップへ戻る</Link>
    </div>
  );
}
