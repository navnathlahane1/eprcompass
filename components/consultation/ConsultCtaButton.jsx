"use client";

export default function ConsultCtaButton({
  children = "Contact us",
  className = "",
  variant = "primary",
}) {
  const styles =
    variant === "secondary"
      ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] border border-[#72ad96] bg-white/90 px-7 text-[15px] font-bold text-[#087657] shadow-sm transition hover:bg-[#f0f8f4]"
      : "epr-button-shine inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#07875f] px-7 text-[15px] font-bold text-white shadow-[0_7px_16px_rgba(4,107,75,.2)] transition hover:-translate-y-0.5 hover:bg-[#066e4e]";

  return (
    <a href="/contact" className={`${styles} ${className}`}>
      {children}
    </a>
  );
}
