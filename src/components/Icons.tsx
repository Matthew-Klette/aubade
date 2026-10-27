/** Hairline icons drawn to match Jost's stroke weight. Decorative: callers label the control. */

type IconProps = { readonly className?: string };

export function ArrowRight({ className = "" }: IconProps) {
  return (
    <svg className={`arrow h-3 w-4 ${className}`} viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path d="M0 6h14.5M10 1.5 14.5 6 10 10.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function ArrowDown({ className = "" }: IconProps) {
  return (
    <svg className={`h-4 w-3 ${className}`} viewBox="0 0 12 16" fill="none" aria-hidden="true">
      <path d="M6 0v14.5M1.5 10 6 14.5 10.5 10" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Plus({ className = "" }: IconProps) {
  return (
    <svg className={`h-3.5 w-3.5 ${className}`} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Close({ className = "" }: IconProps) {
  return (
    <svg className={`h-3.5 w-3.5 ${className}`} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="m1 1 12 12M13 1 1 13" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Menu({ className = "" }: IconProps) {
  return (
    <svg className={`h-3 w-4 ${className}`} viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path d="M0 3.5h16M0 8.5h16" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
