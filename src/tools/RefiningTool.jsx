import { useEffect, useMemo, useState } from 'react'
import ResourceSelector from '../components/ResourceSelector.jsx'
import EnchantSelect from '../components/EnchantSelect.jsx'
import BrandGlyph from '../components/BrandGlyph.jsx'
import NumberInput from '../components/NumberInput.jsx'
import MaterialsTable from '../components/MaterialsTable.jsx'
import MissingList from '../components/MissingList.jsx'
import BulkView from './BulkView.jsx'
import { computeRequirements, formatNumber } from '../lib/calculate.js'
import {
  RECIPES,
  REFINED_RESOURCES,
  iconOf,
  makeId,
  maxEnchantOf,
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
const INITIAL_MODE = INITIAL.mode === 'bulk' ? 'bulk' : 'single'
const INITIAL_BULK =
  INITIAL.bulk && typeof INITIAL.bulk === 'object' && !Array.isArray(INITIAL.bulk)
    ? INITIAL.bulk
    : {}

/**
 * The refining calculator, in two modes behind a toggle:
 *
 * - single chain: pick a refined resource and an enchantment grade, set the
 *   quantity you want, tick what you already own at every level of the chain;
 * - bulk: dump the whole raw stock and get the climb to each type's top tier.
 *
 * Both update live and are persisted to localStorage.
 */
export default function RefiningTool() {
  const { t, resourceName } = useI18n()
  const [mode, setMode] = useState(INITIAL_MODE)
  const [selectedId, setSelectedId] = useState(INITIAL_SELECTION)
  const [enchant, setEnchant] = useState(() => {
    const n = Math.floor(Number(INITIAL.enchant))
    return Number.isFinite(n) && n >= 0 && n <= 4 ? n : 0
  })
  const [quantity, setQuantity] = useState(String(INITIAL.quantity ?? '1'))
  const [possessed, setPossessed] = useState(INITIAL.possessed ?? {})
  const [bulk, setBulk] = useState(INITIAL_BULK)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode, selectedId, enchant, quantity, possessed, bulk }),
      )
    } catch {
      // storage unavailable (private mode) — the tool still works, just not persisted
    }
  }, [mode, selectedId, enchant, quantity, possessed, bulk])

  const target = selectedId ? parseId(selectedId) : null
  // A grade is only meaningful from T4 up (and stone stops at .3), so clamp
  // instead of trusting storage.
  const grade =
    target && target.tier >= 4 && enchant >= 1 && enchant <= maxEnchantOf(target.type)
      ? enchant
      : 0
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
      {/* Mode toggle */}
      <div className="mode-toggle" role="group" aria-label={t('modeGroup')}>
        <button
          type="button"
          className={`mode-btn ${mode === 'single' ? 'is-active' : ''}`}
          aria-pressed={mode === 'single'}
          onClick={() => setMode('single')}
        >
          {t('modeSingle')}
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'bulk' ? 'is-active' : ''}`}
          aria-pressed={mode === 'bulk'}
          onClick={() => setMode('bulk')}
        >
          {t('modeBulk')}
        </button>
      </div>

      {mode === 'bulk' ? (
        <BulkView bulk={bulk} onChange={setBulk} />
      ) : (
        <>
          <section className="panel">
            <div className="controls-grid">
              <ResourceSelector value={selectedId} onSelect={handleSelect} />
              <EnchantSelect
                tier={target?.tier ?? 0}
                type={target?.type}
                value={grade}
                onChange={setEnchant}
                disabled={!selectedId}
              />
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
        </>
      )}
    </div>
  )
}
