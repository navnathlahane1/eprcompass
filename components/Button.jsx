"use client";
import * as Icons from "lucide-react";
import Link from "next/link";

export default function Button({ children, icon, variant = "primary", className = "", href, ...props }) {
  const Icon = typeof icon === "string" ? Icons[icon] : icon;
  const base =
    "inline-flex items-center gap-2 px-8 py-3 rounded-full font-tangent font-semibold focus:outline-none transition-colors duration-200 text-lg justify-center border-2";
  const variants = {
    primary: "bg-eco-green-4 text-white hover:bg-eco-green-3 border-eco-green-4",
    secondary: "bg-white/10 text-white border border-white/40 hover:bg-white/20 border-white/40",
    cta: "bg-transparent text-white border-white hover:bg-white hover:text-eco-green-4 border-white",
  };
  const content = (
    <>
      {Icon && <Icon size={20} className="mr-2" />}
      {children}
    </>
  );

  if (href) {
    return <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...props}>{content}</Link>;
  }

  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{content}</button>;
}
