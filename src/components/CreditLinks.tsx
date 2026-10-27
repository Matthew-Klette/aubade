import { CREDIT_LINKS } from "@/lib/credit";

type CreditLinksProps = {
  readonly className?: string;
  /** "pill" draws each link as an outlined button, for the hero where it has to be found in seconds. */
  readonly variant?: "quiet" | "pill";
};

const LINK_STYLES = {
  quiet: "link-quiet !min-h-11 text-paper",
  pill: "link-quiet !min-h-11 w-full justify-center rounded-full border border-paper/30 px-4 text-paper transition-colors after:hidden hover:border-paper/70 hover:bg-paper/5",
} as const;

/** The maker's external links. Each opens in a new tab and says so to screen readers. */
export function CreditLinks({ className = "", variant = "quiet" }: CreditLinksProps) {
  // Pills sit in a 2×2 grid, so a narrow row never leaves one stranded on its own line.
  return (
    <ul className={`${variant === "pill" ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-x-5"} ${className}`}>
      {CREDIT_LINKS.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            aria-label={`${link.name}, opens in a new tab`}
            className={LINK_STYLES[variant]}
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
