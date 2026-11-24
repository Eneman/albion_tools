import { formatNumber } from '../lib/calculate.js'
import { iconOf, parseId, resourceName } from '../data/resources'

/**
 * Live list of the raw materials still missing — the resources you actually
 * have to gather. Intermediate refined resources are left out on purpose:
 * they are crafted from the raws already listed here.
 */
export default function MissingList({ rows }) {
  const missing = rows.filter((row) => parseId(row.id).kind === 'raw' && row.missing > 0)

  if (missing.length === 0) {
    return (
      <p className="all-good">
        <span aria-hidden="true">✓</span> You already have all the raw materials.
      </p>
    )
  }

  return (
    <ul className="missing-list" aria-live="polite">
      {missing.map((row) => (
        <li key={row.id} className="missing-item">
          <img
            className="res-icon"
            src={iconOf(row.id)}
            alt=""
            aria-hidden="true"
            width="24"
            height="24"
          />
          <span className="missing-name">{resourceName(row.id)}</span>
          <span className="missing-qty">{formatNumber(row.missing)}</span>
        </li>
      ))}
    </ul>
  )
}
