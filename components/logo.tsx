export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label="PayGuard"
    >
      <rect width="96" height="96" rx="20" fill="#1E3A5F" />
      <path
        d="M48 14 L76 22 V48 C76 64 64 76 48 82 C32 76 20 64 20 48 V22 Z"
        fill="#0F766E"
      />
      <path
        d="M34 49 L44 59 L63 37"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
