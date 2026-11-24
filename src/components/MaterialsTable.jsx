import { formatNumber } from '../lib/calculate.js'
import { parseId, resourceName, typeColor } from '../data/resources'

/**
 * The "needed / you have / missing" table for every resource in the chain.
 * Possessions are kept as strings so the field can be cleared while typing.
 */
export default function MaterialsTable({ rows, targetId, possessed, onPossessChange }) {
  return (
    <div className="table-scroll">
      <table className="materials-table">
        <thead>
          <tr>
            <th scope="col">Resource</th>
            <th scope="col" className="num">
              Needed
            </th>
            <th scope="col" className="num">
              You have
            </th>
            <th scope="col" className="num">
              Missing
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isTarget = row.id === targetId
            const cls = isTarget ? 'is-target' : row.missing > 0 ? 'is-short' : 'is-ok'
            return (
              <tr key={row.id} className={cls}>
                <td className="cell-resource" data-label="Resource">
                  <span
                    className="res-dot"
                    style={{ backgroundColor: typeColor(parseId(row.id).type) }}
                  />
                  <span className="res-name">{resourceName(row.id)}</span>
                  {isTarget && <span className="tag">output</span>}
                </td>
                <td className="num" data-label="Needed">
                  {formatNumber(row.needed)}
                </td>
                <td className="cell-input num" data-label="You have">
                  <input
                    className="text-input num-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    aria-label={`How many ${resourceName(row.id)} you already have`}
                    value={possessed[row.id] ?? ''}
                    onChange={(e) => onPossessChange(row.id, e.target.value.replace(/\D/g, ''))}
                  />
                </td>
                <td className={`num missing ${row.missing > 0 ? 'has' : 'none'}`} data-label="Missing">
                  {row.missing > 0 ? formatNumber(row.missing) : '✓'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
