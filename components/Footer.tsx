import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-surface px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 border-t border-brass-dim pt-8 md:flex-row md:items-center md:justify-between">
        <div className="relative h-8 w-[124px] overflow-hidden rounded-md">
          <Image
            src="/logo/pitiusa-box-white.png"
            alt="Pitiusa Art Station"
            fill
            sizes="124px"
            className="object-contain object-left"
          />
        </div>
        <p className="text-sm text-bone-dim">Fabriqué en France</p>
      </div>
    </footer>
  );
}
