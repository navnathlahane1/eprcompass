"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Globe2, Mail, Menu, Phone, UserRound, X } from "lucide-react";
import PublicBrand from "./public-site/PublicBrand";
import { contactDetails } from "@/data/publicSite";
import DesktopNav from "./nav/DesktopNav";
import MobileMenu from "./nav/MobileMenu";

function TopBar() {
  return (
    <div className="bg-[var(--epr-navy)] text-[13px] text-white/90">
      <div className="epr-container flex h-9 max-w-[1240px] items-center justify-between">
        <span className="hidden sm:inline">EPR compliance software for every requirement.</span>
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
          <Link href="/global-coverage" className="hidden items-center gap-1.5 sm:flex hover:text-[var(--epr-lime)]">
            <Globe2 size={12} /> Global Coverage
          </Link>
          {contactDetails.phoneDisplay && <a href={contactDetails.phoneHref} className="flex items-center gap-1.5 transition hover:text-[var(--epr-lime)]">
            <Phone size={11} /> Support: {contactDetails.phoneDisplay}
          </a>}
          {contactDetails.email && <a href={contactDetails.emailHref} className="hidden items-center gap-1.5 transition hover:text-[var(--epr-lime)] lg:flex">
            <Mail size={11} /> {contactDetails.email}
          </a>}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  return <NavbarContent key={pathname} pathname={pathname} />;
}

function NavbarContent({ pathname }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const headerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";
  const navOffset = isHome ? "64px" : "100px";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia('(min-width: 1280px)');
    const onResize = () => { if (desktop.matches) setOpen(false); };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const elements = [...headerRef.current.querySelectorAll('a[href], button:not([disabled])')]
        .filter((element) => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    desktop.addEventListener('change', onResize);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener('change', onResize);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`ec-site-header sticky top-0 z-50 isolate w-full border-b border-[var(--epr-border)] bg-white font-[family-name:var(--font-sans)] text-[var(--epr-ink)] transition-shadow duration-300 ${scrolled ? "shadow-[0_10px_28px_rgba(13,65,52,0.12)]" : "shadow-[0_5px_22px_rgba(13,65,52,0.08)]"}`}
      style={{ "--nav-offset": navOffset }}
    >
      {isHome ? null : <TopBar />}
      <nav className="epr-container flex h-[64px] max-w-[1240px] items-center justify-between gap-4" aria-label="Primary navigation">
        <PublicBrand />
        <DesktopNav />
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <Link href="/login" className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-4 text-sm font-bold transition ${isHome ? "border-[#563080] text-[#28104f] hover:bg-[#f1e5fa]" : "border-[#86b9a6] text-[#0a6e50] hover:bg-[var(--epr-pale)]"}`}>
            <UserRound size={14} /> Login
          </Link>
          <Link
            href="/signup"
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-px ${isHome ? "bg-[#28104f] hover:bg-[#562685]" : "bg-[var(--epr-green)] hover:bg-[var(--epr-green-dark)]"}`}
          >
            Create account <ArrowRight size={13} />
          </Link>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--epr-border)] xl:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
      {open ? (
        <div
          id="mobile-navigation"
          className={`fixed inset-x-0 bottom-0 z-50 overflow-y-auto overscroll-contain border-t border-[var(--epr-border)] bg-white px-5 pb-10 pt-2 shadow-xl xl:hidden ${isHome ? "top-[64px]" : "top-[100px]"}`}
        >
          <MobileMenu
            onClose={() => setOpen(false)}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/login" className="epr-button epr-button-secondary" onClick={() => setOpen(false)}>Login</Link>
            <Link href="/signup" className="epr-button epr-button-primary" onClick={() => setOpen(false)}>Create account</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
