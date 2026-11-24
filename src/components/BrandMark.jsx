export default function BrandMark({ width = 26, height = 26, className = '' }) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      width={width}
      height={height}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#1b1714" />
      <rect x="4" y="4" width="56" height="56" rx="11" fill="none" stroke="#d8a94e" strokeWidth="3" />
      <path
        d="M18 44 L32 16 L46 44 Z"
        fill="none"
        stroke="#d8a94e"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M24 36 H40" stroke="#f0c86e" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
