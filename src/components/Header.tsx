"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, INTRO_SECONDS } from "@/lib/gsap";
import { formatClock, formatKelvin } from "@/lib/daylight";
import { useDaylightNow } from "@/hooks/useDaylightNow";
import { CREDIT_NAME, PORTFOLIO_URL } from "@/lib/credit";
import { CreditLinks } from "./CreditLinks";
import { Close, Menu } from "./Icons";

const NAV = [
  { href: "#day", label: "A day" },
  { href: "#object", label: "The object" },
  { href: "#configure", label: "Configure" },
  { href: "#specifications", label: "Specifications" },
] as const;

/** Distance scrolled before the header starts hiding on the way down. */
const HIDE_AFTER_PX = 240;
/** Where the inline nav takes over from the dropdown (Tailwind's lg). */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** Moves focus to an in-page target so keyboard users continue from there, not from the top. */
function focusSection(href: string) {
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const now = useDaylightNow();
  const [menuOpen, setMenuOpen] = useState(false);

  // Below lg the nav lives in a dropdown. Escape, a click outside or any scroll closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onScroll = () => setMenuOpen(false);
    // Rotating or resizing up to the inline nav must not leave the dropdown open for the way back.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktop = (event: MediaQueryListEvent) => event.matches && setMenuOpen(false);
    desktop.addEventListener("change", onDesktop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Entrance and scroll hide/show drive different elements, so neither cancels the other.
        gsap.from(header, { yPercent: -140, duration: 1.2, ease: "expo.out", delay: INTRO_SECONDS + 0.4 });
        const slide = gsap.quickTo(".header-bar", "yPercent", { duration: 0.6, ease: "expo.out" });
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            const hide = self.direction === 1 && self.scroll() > HIDE_AFTER_PX;
            slide(hide ? -140 : 0);
          },
        });
      });
    },
    { scope: headerRef },
  );

  return (
    <header ref={headerRef} className="fixed inset-x-3 top-3 z-50 sm:inset-x-5 sm:top-4 short-land:top-2">
      <div className="header-bar mx-auto flex h-14 max-w-[1600px] short-land:h-12 items-center justify-between gap-4 rounded-full border border-line bg-ink/55 pr-2 pl-5 backdrop-blur-xl backdrop-saturate-150 sm:pl-6">
        <div className="flex items-center gap-5">
          <a href="#top" className="flex min-h-11 items-center" aria-label="Aubade, back to top">
            <span className="font-display text-[1.35rem] tracking-[0.02em] italic">Aubade</span>
          </a>
          {/* Wide screens only; narrower ones carry the credit in the menu and the hero. */}
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={`By ${CREDIT_NAME}: portfolio, opens in a new tab`}
            className="eyebrow hidden min-h-11 items-center gap-1.5 text-mist transition-colors hover:text-paper xl:inline-flex"
          >
            By {CREDIT_NAME} <span aria-hidden="true">↗</span>
          </a>
        </div>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => focusSection(item.href)}
                  className="eyebrow inline-flex min-h-11 items-center rounded-full px-4 text-mist transition-colors duration-300 hover:text-paper"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <p className="eyebrow hidden items-center gap-2.5 text-mist md:flex lg:hidden" aria-live="off">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full transition-colors duration-1000"
              style={{
                background: now?.sample.lamp ?? "var(--color-mist)",
                boxShadow: now ? `0 0 12px 2px ${now.sample.lamp}` : undefined,
              }}
            />
            <span className="tabular">
              {now ? `${formatClock(now.sample.hour)} ${now.city} · ${formatKelvin(now.sample.kelvin)}` : "Following the sun"}
            </span>
          </p>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label="Menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-paper transition-colors hover:bg-paper/10 short-land:h-10 short-land:w-10 lg:hidden"
          >
            {menuOpen ? <Close /> : <Menu />}
          </button>
          <a href="#configure" className="btn-brass !min-h-10 !px-5">
            Reserve
          </a>
        </div>
      </div>

      {/* Scrolls inside itself on very short screens; that isn't a window scroll, so it doesn't close the menu. */}
      <div
        id="site-menu"
        hidden={!menuOpen}
        className="mx-auto mt-2 max-h-[calc(100svh-5rem)] max-w-[1600px] overflow-y-auto overscroll-contain rounded-[1.75rem] border border-line bg-ink/90 p-2 backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      >
        <nav aria-label="Primary">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => {
                    setMenuOpen(false);
                    focusSection(item.href);
                  }}
                  className="display flex min-h-14 items-center rounded-[1.25rem] px-4 t-display-sm transition-colors hover:bg-paper/5"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 border-t border-line px-4 pt-2">
          <p className="eyebrow text-mist">A concept by {CREDIT_NAME}</p>
          <CreditLinks />
        </div>
      </div>
    </header>
  );
}
