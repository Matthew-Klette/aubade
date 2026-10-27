/** Who made this concept site, and where to find them. Shown in the header, hero, menu and footer. */
export const CREDIT_NAME = "Matt Klette";

export const PORTFOLIO_URL = "https://mattklette-builds.vercel.app";

/** `name` starts with the visible label, so voice control still matches what's on screen. */
export const CREDIT_LINKS = [
  { label: "Portfolio", name: `Portfolio of ${CREDIT_NAME}`, href: PORTFOLIO_URL },
  { label: "Source", name: "Source code for Aubade on GitHub", href: "https://github.com/Matthew-Klette/aubade" },
  { label: "GitHub", name: `GitHub profile of ${CREDIT_NAME}`, href: "https://github.com/Matthew-Klette" },
  { label: "LinkedIn", name: `LinkedIn profile of ${CREDIT_NAME}`, href: "https://www.linkedin.com/in/matthewklette" },
] as const;
