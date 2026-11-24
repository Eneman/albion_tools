import { formatNumber } from '../lib/calculate.js'
import { parseId, resourceName, typeColor } from '../data/resources'

/** Compact, live list of everything that is still missing. */
export default function MissingList({ rows, targetId }) {
  const missing = rows.filter((row) => row.missing > 0)

  if (missing.length === 0) {
    return (
      <p className="all-good">
        <span aria-hidden="true">✓</span> You have everything needed.
      </p>
    )
  }

  return (
    <div className="missing-chips" aria-live="polite">
      {missing.map((row) => (
        <span
          key={row.id}
          className={`chip ${row.id === targetId ? 'is-target' : ''}`}
        >
          <span
            className="res-dot"
            style={{ backgroundColor: typeColor(parseId(row.id).type) }}
          />
          <span className="chip-qty">{formatNumber(row.missing)}×</span>
          <span className="chip-name">{resourceName(row.id)}</span>
        </span>
      ))}
    </div>
  )
}
