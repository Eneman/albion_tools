import { useMemo } from 'react'
import BrandGlyph from '../components/BrandGlyph.jsx'
import MissingList from '../components/MissingList.jsx'
import NumberInput from '../components/NumberInput.jsx'
import { bulkMissing, bulkPlan } from '../lib/bulk.js'
import { formatNumber } from '../lib/calculate.js'
import { TIERS, TYPES, iconOf, makeId } from '../data/resources'
import { useI18n } from '../i18n.jsx'

/**
 * Bulk mode: one field per raw resource (T2–T8 × 5 types) for the whole
 * stock. Every type is refined up to the highest tier held, the planned
 * output is listed per type, and all the shortfalls are gathered into a
 * single missing list.
 */
export default function BulkView({ bulk, onChange }) {
  const { t, lang, resourceName } = useI18n()

  const plans = useMemo(() => bulkPlan(bulk), [bulk])
  const missingRows = useMemo(() => bulkMissing(plans), [plans])
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

        <div className="bulk-rows">
          {TYPES.map((type) => (
            <div className="bulk-row" key={type.id}>
              <span className="bulk-type">{lang === 'fr' ? type.labelFr : type.label}</span>
              <div className="bulk-cells">
                {TIERS.map((tier) => {
                  const id = makeId(type.id, tier, 'raw')
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
                <li className="bulk-plan" key={plan.type}>
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
            <MissingList rows={missingRows} />
          </section>
        </>
      )}
    </>
  )
}
