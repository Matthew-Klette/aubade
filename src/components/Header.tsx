"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, INTRO_SECONDS } from "@/lib/gsap";
import { formatClock, formatKelvin } from "@/lib/daylight";
import { useDaylightNow } from "@/hooks/useDaylightNow";

const NAV = [
  { href: "#day", label: "A day" },
  { href: "#object", label: "The object" },
  { href: "#configure", label: "Configure" },
  { href: "#specifications", label: "Specifications" },
] as const;

/** Distance scrolled before the header starts hiding on the way down. */
const HIDE_AFTER_PX = 240;

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const now = useDaylightNow();

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
    <header ref={headerRef} className="fixed inset-x-3 top-3 z-50 sm:inset-x-5 sm:top-4">
      <div className="header-bar mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 rounded-full border border-line bg-ink/55 pr-2 pl-5 backdrop-blur-xl backdrop-saturate-150 sm:pl-6">
        <a href="#top" className="flex min-h-11 items-center" aria-label="Aubade, back to top">
          <span className="font-display text-[1.35rem] tracking-[0.02em] italic">Aubade</span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="eyebrow inline-flex min-h-11 items-center rounded-full px-4 text-mist transition-colors duration-300 hover:text-paper"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <p className="eyebrow hidden items-center gap-2.5 text-mist md:flex" aria-live="off">
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
          <a href="#configure" className="btn-brass !min-h-10 !px-5">
            Reserve
          </a>
        </div>
      </div>
    </header>
  );
}
