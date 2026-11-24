import { useEffect, useMemo, useState } from 'react'
import ResourceSelector from '../components/ResourceSelector.jsx'
import MaterialsTable from '../components/MaterialsTable.jsx'
import MissingList from '../components/MissingList.jsx'
import { computeRequirements, formatNumber } from '../lib/calculate.js'
import { RECIPES, REFINED_RESOURCES, makeId, parseId, resourceName } from '../data/resources'

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
 * The refining calculator: pick a refined resource, set the quantity you want,
 * tick what you already own at every level of the chain — the table and the
 * compact missing list update live. State is persisted to localStorage.
 */
export default function RefiningTool() {
  const [selectedId, setSelectedId] = useState(INITIAL_SELECTION)
  const [quantity, setQuantity] = useState(String(INITIAL.quantity ?? '1'))
  const [possessed, setPossessed] = useState(INITIAL.possessed ?? {})

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedId, quantity, possessed }))
    } catch {
      // storage unavailable (private mode) — the tool still works, just not persisted
    }
  }, [selectedId, quantity, possessed])

  const target = selectedId ? parseId(selectedId) : null
  const qty = /^\d+$/.test(quantity) ? parseInt(quantity, 10) : 0

  const rows = useMemo(
    () => (selectedId ? computeRequirements(selectedId, qty, possessed) : []),
    [selectedId, qty, possessed],
  )

  const targetRow = rows.find((row) => row.id === selectedId)
  const toCraft = targetRow?.missing ?? 0
  const ownedTarget = targetRow?.possessed ?? 0
  const hasOwned = Object.values(possessed).some((v) => v !== '' && v != null)

  // "1× T5 Brick = 3× T5 Stone + 1× T4 Brick"
  let recipeLeft = ''
  let recipeRight = ''
  if (target) {
    const recipe = RECIPES[target.tier]
    const parts = [`${recipe.raw}× ${resourceName(makeId(target.type, target.tier, 'raw'))}`]
    if (recipe.prev > 0) {
      parts.push(`${recipe.prev}× ${resourceName(makeId(target.type, target.tier - 1, 'refined'))}`)
    }
    recipeLeft = `1× ${resourceName(selectedId)}`
    recipeRight = parts.join(' + ')
  }

  const handlePossess = (id, value) =>
    setPossessed((prev) => ({ ...prev, [id]: value }))

  return (
    <div className="tool">
      <section className="panel">
        <div className="controls-grid">
          <ResourceSelector value={selectedId} onSelect={setSelectedId} />
          <div className="field">
            <label className="field-label" htmlFor="quantity-input">
              Quantity wanted
            </label>
            <input
              id="quantity-input"
              className="text-input quantity-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={selectedId ? 'e.g. 100' : 'Select a resource'}
              disabled={!selectedId}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
        {recipeLeft && (
          <p className="recipe-hint">
            <strong>{recipeLeft}</strong> = {recipeRight}
          </p>
        )}
      </section>

      {!selectedId ? (
        <div className="empty-state">
          <BrandGlyph />
          <p className="empty-title">No resource selected</p>
          <p className="empty-text">
            Pick a refined resource above — T2 to T8 brick, plank, leather, cloth or metal — and
            we will list every material in the chain.
          </p>
        </div>
      ) : qty <= 0 ? (
        <div className="empty-state">
          <BrandGlyph />
          <p className="empty-title">Enter a quantity</p>
          <p className="empty-text">
            Tell us how many {resourceName(selectedId)} you want and we will list every material
            involved.
          </p>
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="panel-head">
              <h2>Materials needed</h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPossessed({})}
                disabled={!hasOwned}
              >
                Clear owned
              </button>
            </div>
            <p className="summary">
              Crafting <span className="craft-count">{formatNumber(toCraft)}×</span>{' '}
              {resourceName(selectedId)}
              {ownedTarget > 0 && (
                <>
                  {' '}
                  — {formatNumber(qty)} wanted, {formatNumber(ownedTarget)} already owned
                </>
              )}
            </p>
            <MaterialsTable
              rows={rows}
              targetId={selectedId}
              possessed={possessed}
              onPossessChange={handlePossess}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Missing</h2>
            </div>
            <MissingList rows={rows} targetId={selectedId} />
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
