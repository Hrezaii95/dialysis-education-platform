// Pulse-R mark — locked identity (design-system/identity/Final Identity - Locked.dc.html).
// Ring + R in the current theme ink, heartbeat crossbar always green (the mark's one
// signal color — never recolored). Reversed automatically via CSS (fill/stroke follow
// currentColor for the ring; the heartbeat path is hardcoded lime-green per brand rule).
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width="30"
        height="30"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden
        className="shrink-0 text-text"
      >
        <g stroke="currentColor">
          <circle cx="102" cy="99" r="85.75" strokeWidth="9" />
          <path d="M26 54.5 H125 A40.5 40.5 0 0 1 154.5 95 A37.6 37.6 0 0 1 110 130" strokeWidth="8.5" />
          <path d="M63.5 90 V177" strokeWidth="8.5" />
          <path d="M109 133 L140 177" strokeWidth="9" />
        </g>
        <path
          d="M15 91.5 H76 L86 74 L96 106 L105 91.5 H119.5"
          stroke="#35C98E"
          strokeWidth="8.5"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight">
            RAOUF
          </span>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
            Clinical Academy
          </span>
        </span>
      )}
    </span>
  );
}
