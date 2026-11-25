import { formatNumber } from '../lib/calculate.js'
import NumberInput from './NumberInput.jsx'
import { iconOf } from '../data/resources'
import { useI18n } from '../i18n.jsx'

/**
 * The "needed / you have / missing" table for every MATERIAL in the chain.
 * The target resource (the output you are crafting) is not a material, so it
 * is excluded from this list.
 * Possessions are kept as strings so the field can be cleared while typing.
 */
export default function MaterialsTable({ rows, targetId, possessed, onPossessChange }) {
  const { t, resourceName } = useI18n()
  const materials = rows.filter((row) => row.id !== targetId)

  return (
    <div className="table-scroll">
      <table className="materials-table">
        <thead>
          <tr>
            <th scope="col">{t('thResource')}</th>
            <th scope="col" className="num">
              {t('thNeeded')}
            </th>
            <th scope="col" className="num">
              {t('thOwned')}
            </th>
            <th scope="col" className="num">
              {t('thMissing')}
            </th>
          </tr>
        </thead>
        <tbody>
          {materials.map((row) => {
            const cls = row.missing > 0 ? 'is-short' : 'is-ok'
            const name = resourceName(row.id)
            return (
              <tr key={row.id} className={cls}>
                <td className="cell-resource" data-label={t('thResource')}>
                  <img
                    className="res-icon"
                    src={iconOf(row.id)}
                    alt=""
                    aria-hidden="true"
                    width="24"
                    height="24"
                  />
                  <span className="res-name">{name}</span>
                </td>
                <td className="num" data-label={t('thNeeded')}>
                  {formatNumber(row.needed)}
                </td>
                <td className="cell-input num" data-label={t('thOwned')}>
                  <NumberInput
                    className="num-input"
                    placeholder="0"
                    aria-label={t('ariaOwned', { name })}
                    value={possessed[row.id] ?? ''}
                    onChange={(value) => onPossessChange(row.id, value)}
                  />
                </td>
                <td
                  className={`num missing ${row.missing > 0 ? 'has' : 'none'}`}
                  data-label={t('thMissing')}
                >
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
