/** The little mountain mark shown in the empty states. */
export default function BrandGlyph() {
  return (
    <svg
      className="empty-mark"
      viewBox="0 0 64 64"
      width="56"
      height="56"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 44 L32 16 L46 44 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M24 36 H40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
