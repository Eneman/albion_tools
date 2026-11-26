import { useEffect, useMemo, useState } from 'react'
import ResourceSelector from '../components/ResourceSelector.jsx'
import EnchantSelect from '../components/EnchantSelect.jsx'
import NumberInput from '../components/NumberInput.jsx'
import MaterialsTable from '../components/MaterialsTable.jsx'
import MissingList from '../components/MissingList.jsx'
import { computeRequirements, formatNumber } from '../lib/calculate.js'
import {
  RECIPES,
  REFINED_RESOURCES,
  iconOf,
  makeId,
  outputPerCraft,
  parseId,
  prevEnchantOf,
} from '../data/resources'
import { useI18n } from '../i18n.jsx'

const STORAGE_KEY = 'albion-tools:refining:v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const INITIAL = loadState()
const INITIAL_SELECTION = REFINED_RESOURCES.some((r) => r.id === INITIAL.selectedId)
  ? INITIAL.selectedId
  : ''

/**
 * The refining calculator: pick a refined resource and an enchantment grade,
 * set the quantity you want, tick what you already own at every level of the
 * chain — the table and the compact missing list update live. State is
 * persisted to localStorage.
 */
export default function RefiningTool() {
  const { t, resourceName } = useI18n()
  const [selectedId, setSelectedId] = useState(INITIAL_SELECTION)
  const [enchant, setEnchant] = useState(() => {
    const n = Math.floor(Number(INITIAL.enchant))
    return Number.isFinite(n) && n >= 0 && n <= 3 ? n : 0
  })
  const [quantity, setQuantity] = useState(String(INITIAL.quantity ?? '1'))
  const [possessed, setPossessed] = useState(INITIAL.possessed ?? {})

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedId, enchant, quantity, possessed }),
      )
    } catch {
      // storage unavailable (private mode) — the tool still works, just not persisted
    }
  }, [selectedId, enchant, quantity, possessed])

  const target = selectedId ? parseId(selectedId) : null
  // A grade is only meaningful from T4 up, so clamp instead of trusting storage.
  const grade = target && target.tier >= 4 && enchant >= 1 && enchant <= 3 ? enchant : 0
  const targetId = target ? makeId(target.type, target.tier, 'refined', grade) : null
  const qty = /^\d+$/.test(quantity) ? parseInt(quantity, 10) : 0

  const handleSelect = (id) => {
    setSelectedId(id)
    if (parseId(id).tier < 4) setEnchant(0)
  }

  // The target itself is crafted, not gathered: ignore any stale stored value
  // for it so only the chain materials count as owned.
  const materialPossessed = useMemo(() => {
    if (!targetId || possessed[targetId] == null) return possessed
    const { [targetId]: _drop, ...rest } = possessed
    return rest
  }, [possessed, targetId])

  const rows = useMemo(
    () => (targetId ? computeRequirements(targetId, qty, materialPossessed) : []),
    [targetId, qty, materialPossessed],
  )

  const targetRow = rows.find((row) => row.id === targetId)
  const toCraft = targetRow?.missing ?? 0
  const hasOwned = Object.values(possessed).some((v) => v !== '' && v != null)

  // "1× T5 Brick = 3× T5 Stone + 1× T4 Brick" — or, for enchanted stone where
  // one craft yields several blocks, "4× T5 Brick = 3× T5.2 Stone + 4× T4 Brick".
  let recipeLeft = ''
  let recipeRight = ''
  let showStoneHint = false
  if (target && targetId) {
    const { type, tier } = target
    const recipe = RECIPES[tier]
    const out = outputPerCraft(type, tier, grade)
    const parts = [`${recipe.raw}× ${resourceName(makeId(type, tier, 'raw', grade))}`]
    if (recipe.prev > 0) {
      parts.push(
        `${out}× ${resourceName(makeId(type, tier - 1, 'refined', prevEnchantOf(type, tier, grade)))}`,
      )
    }
    recipeLeft = `${out}× ${resourceName(targetId)}`
    recipeRight = parts.join(' + ')
    showStoneHint = type === 'stone' && grade > 0
  }

  const handlePossess = (id, value) =>
    setPossessed((prev) => ({ ...prev, [id]: value }))

  return (
    <div className="tool">
      <section className="panel">
        <div className="controls-grid">
          <ResourceSelector value={selectedId} onSelect={handleSelect} />
          <EnchantSelect tier={target?.tier ?? 0} value={grade} onChange={setEnchant} disabled={!selectedId} />
          <div className="field">
            <label className="field-label" htmlFor="quantity-input">
              {t('labelQuantity')}
            </label>
            <NumberInput
              id="quantity-input"
              className="quantity-input"
              placeholder={selectedId ? t('placeholderQty') : t('placeholderNone')}
              disabled={!selectedId}
              value={quantity}
              onChange={setQuantity}
            />
          </div>
        </div>
        {recipeLeft && (
          <p className="recipe-hint">
            <strong>{recipeLeft}</strong> = {recipeRight}
          </p>
        )}
        {showStoneHint && <p className="recipe-note">{t('stoneHint')}</p>}
      </section>

      {!selectedId ? (
        <div className="empty-state">
          <BrandGlyph />
          <p className="empty-title">{t('emptyResTitle')}</p>
          <p className="empty-text">{t('emptyResText')}</p>
        </div>
      ) : qty <= 0 ? (
        <div className="empty-state">
          <BrandGlyph />
          <p className="empty-title">{t('emptyQtyTitle')}</p>
          <p className="empty-text">
            {t('emptyQtyText', { name: resourceName(targetId) })}
          </p>
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="panel-head">
              <h2>{t('panelMaterials')}</h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPossessed({})}
                disabled={!hasOwned}
              >
                {t('clearOwned')}
              </button>
            </div>
            <p className="summary">
              {t('summaryCraft')} <span className="craft-count">{formatNumber(toCraft)}×</span>{' '}
              <img
                className="res-icon"
                src={iconOf(targetId)}
                alt=""
                aria-hidden="true"
                width="22"
                height="22"
              />
              {resourceName(targetId)}
            </p>
            <MaterialsTable
              rows={rows}
              targetId={targetId}
              possessed={possessed}
              onPossessChange={handlePossess}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>{t('panelMissing')}</h2>
            </div>
            <MissingList rows={rows} />
          </section>
        </>
      )}
    </div>
  )
}

function BrandGlyph() {
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
