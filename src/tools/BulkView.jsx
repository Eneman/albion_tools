import { useMemo } from 'react'
import BrandGlyph from '../components/BrandGlyph.jsx'
import MissingList from '../components/MissingList.jsx'
import NumberInput from '../components/NumberInput.jsx'
import { bulkCompute, gradesFor } from '../lib/bulk.js'
import { formatNumber } from '../lib/calculate.js'
import { TIERS, TYPES, iconOf, makeId } from '../data/resources'
import { useI18n } from '../i18n.jsx'

/**
 * Bulk mode: one field per raw resource — T2–T8 × 5 types × every grade the
 * type has (.0–.4, stone .0–.3) — for the whole stock. Each type and grade
 * climbs to the highest tier held for it (enchanted raws refine up their own
 * grade), the planned outputs are listed, and every shortfall gathers into a
 * single missing list.
 */
export default function BulkView({ bulk, onChange }) {
  const { t, lang, resourceName } = useI18n()

  const { plans, rows } = useMemo(() => bulkCompute(bulk), [bulk])
  const hasStock = Object.values(bulk).some((v) => v !== '' && v != null)

  const setCell = (id, value) => onChange({ ...bulk, [id]: value })

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>{t('bulkStockTitle')}</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onChange({})}
            disabled={!hasStock}
          >
            {t('clearStock')}
          </button>
        </div>

        <div className="bulk-grid">
          {/* Tier header row — cells carry their own labels on small screens. */}
          <div className="bulk-head" aria-hidden="true">
            <span />
            {TIERS.map((tier) => (
              <span key={tier}>T{tier}</span>
            ))}
          </div>

          {TYPES.map((type) => (
            <div className="bulk-group" key={type.id}>
              <h3 className="bulk-group-name">{lang === 'fr' ? type.labelFr : type.label}</h3>
              {gradesFor(type.id).map((grade) => (
                <div className="bulk-line" key={grade}>
                  <span className="bulk-grade">.{grade}</span>
                  {TIERS.map((tier) => {
                    // Enchanted raws only exist from T4 up — no T2/T3 cells.
                    if (grade > 0 && tier < 4) {
                      return <span className="bulk-cell is-empty" key={tier} aria-hidden="true" />
                    }
                    const id = makeId(type.id, tier, 'raw', grade)
                    const name = resourceName(id)
                    return (
                      <label className="bulk-cell" key={tier} htmlFor={`bulk-${id}`}>
                        <span className="field-label">T{tier}</span>
                        <NumberInput
                          id={`bulk-${id}`}
                          placeholder="0"
                          aria-label={t('ariaOwned', { name })}
                          value={bulk[id] ?? ''}
                          onChange={(value) => setCell(id, value)}
                        />
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="recipe-note">{t('bulkNote')}</p>
      </section>

      {plans.length === 0 ? (
        <div className="empty-state">
          <BrandGlyph />
          <p className="empty-title">{t('bulkEmptyTitle')}</p>
          <p className="empty-text">{t('bulkEmptyText')}</p>
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="panel-head">
              <h2>{t('bulkPlanTitle')}</h2>
            </div>
            <ul className="bulk-plans">
              {plans.map((plan) => (
                <li className="bulk-plan" key={plan.targetId}>
                  <img
                    className="res-icon"
                    src={iconOf(plan.targetId)}
                    alt=""
                    aria-hidden="true"
                    width="24"
                    height="24"
                  />
                  <span className="bulk-plan-qty">{formatNumber(plan.quantity)}×</span>
                  <span className="bulk-plan-name">{resourceName(plan.targetId)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{t('panelMissing')}</h2>
            </div>
            <MissingList rows={rows} />
          </section>
        </>
      )}
    </>
  )
}
