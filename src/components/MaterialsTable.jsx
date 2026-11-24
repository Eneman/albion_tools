import { formatNumber } from '../lib/calculate.js'
import NumberInput from './NumberInput.jsx'
import { iconOf, resourceName } from '../data/resources'

/**
 * The "needed / you have / missing" table for every MATERIAL in the chain.
 * The target resource (the output you are crafting) is not a material, so it
 * is excluded — its "you have" input lives in the controls above.
 * Possessions are kept as strings so the field can be cleared while typing.
 */
export default function MaterialsTable({ rows, targetId, possessed, onPossessChange }) {
  const materials = rows.filter((row) => row.id !== targetId)

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
          {materials.map((row) => {
            const cls = row.missing > 0 ? 'is-short' : 'is-ok'
            return (
              <tr key={row.id} className={cls}>
                <td className="cell-resource" data-label="Resource">
                  <img
                    className="res-icon"
                    src={iconOf(row.id)}
                    alt=""
                    aria-hidden="true"
                    width="24"
                    height="24"
                  />
                  <span className="res-name">{resourceName(row.id)}</span>
                </td>
                <td className="num" data-label="Needed">
                  {formatNumber(row.needed)}
                </td>
                <td className="cell-input num" data-label="You have">
                  <NumberInput
                    className="num-input"
                    placeholder="0"
                    aria-label={`How many ${resourceName(row.id)} you already have`}
                    value={possessed[row.id] ?? ''}
                    onChange={(value) => onPossessChange(row.id, value)}
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
