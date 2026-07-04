export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="raoufMark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1bd3bf" />
            <stop offset="1" stopColor="#1f6bff" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#raoufMark)" />
        <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="black" opacity="0.12" />
        {/* convection flow lines */}
        <path d="M7 11.5C12 8.5 20 14.5 25 11.5" stroke="white" strokeOpacity="0.95" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 16C12 13 20 19 25 16" stroke="white" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 20.5C12 17.5 20 23.5 25 20.5" stroke="white" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">
            Raouf Renal <span className="text-flow">Academy</span>
          </span>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
            Interactive HDF training
          </span>
        </span>
      )}
    </span>
  );
}
