import Image from "next/image";
import Link from "next/link";

export default function PublicBrand({ inverse = false, compact = false }) {
  return (
    <Link href="/" className="group inline-flex shrink-0 items-center gap-2.5" aria-label="EPR Compass home">
      <Image
        src="/imgs/epr-compass/epr-compass-platform.png"
        alt=""
        aria-hidden="true"
        width={52}
        height={52}
        preload={!compact}
        className="block h-[48px] w-[48px] shrink-0 rounded-full object-contain sm:h-[52px] sm:w-[52px]"
      />
      <span className={`whitespace-nowrap font-serif text-[21px] font-bold leading-none tracking-[-0.04em] sm:text-[23px] ${inverse ? "text-white" : "text-[#28104f]"}`}>
        EPR Compass
      </span>
    </Link>
  );
}
