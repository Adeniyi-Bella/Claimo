export function ClaimoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="url(#claimo-g)" />
      <path d="M9 11.5C9 9.567 10.567 8 12.5 8H22a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-7.5a1 1 0 0 0-1 1V18a1 1 0 0 0 1 1H22a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-9.5A3.5 3.5 0 0 1 9 21V11.5Z" fill="white" />
      <circle cx="22" cy="22.5" r="2" fill="oklch(0.85 0.15 145)" stroke="white" strokeWidth="1.2" />
      <defs>
        <linearGradient id="claimo-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.42 0.13 255)" />
          <stop offset="1" stopColor="oklch(0.28 0.08 255)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
