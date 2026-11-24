/**
 * Numeric input with little up/down arrows on the right — and ArrowUp /
 * ArrowDown on the keyboard — to nudge a quantity one step at a time.
 * Values stay strings so the field can be cleared while typing.
 */
export default function NumberInput({ value, onChange, className = '', ...inputProps }) {
  const disabled = inputProps.disabled === true

  const step = (delta) => {
    if (disabled) return
    const current = /^\d+$/.test(value) ? parseInt(value, 10) : 0
    onChange(String(Math.max(0, current + delta)))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      step(-1)
    }
  }

  return (
    <span className="stepper">
      <input
        {...inputProps}
        className={`text-input ${className}`.trim()}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        onKeyDown={handleKeyDown}
      />
      <span className="stepper-buttons">
        <button
          type="button"
          className="stepper-btn"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onClick={() => step(1)}
        >
          <svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true" focusable="false">
            <path d="M5 0 10 6 0 6Z" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="stepper-btn"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onClick={() => step(-1)}
        >
          <svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true" focusable="false">
            <path d="M0 0 10 0 5 6Z" fill="currentColor" />
          </svg>
        </button>
      </span>
    </span>
  )
}
