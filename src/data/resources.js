/**
 * Static game data: resource types, tiers and refining recipes.
 *
 * A refined resource always consumes:
 *  - `raw` units of the SAME tier raw resource
 *  - `prev` units of the PREVIOUS tier refined resource (0 at T2)
 */

export const TYPES = [
  { id: 'stone', raw: 'Stone', refined: 'Brick', color: '#9aa5b1' },
  { id: 'wood', raw: 'Wood', refined: 'Plank', color: '#b07d46' },
  { id: 'hide', raw: 'Hide', refined: 'Leather', color: '#cf9355' },
  { id: 'cotton', raw: 'Cotton', refined: 'Cloth', color: '#e8e2d2' },
  { id: 'ore', raw: 'Ore', refined: 'Metal', color: '#8fa8bf' },
]

export const TIERS = [2, 3, 4, 5, 6, 7, 8]

/** RECIPES[tier] = raw materials needed to refine 1 unit of that tier. */
export const RECIPES = {
  2: { raw: 2, prev: 0 },
  3: { raw: 2, prev: 1 },
  4: { raw: 2, prev: 1 },
  5: { raw: 3, prev: 1 },
  6: { raw: 4, prev: 1 },
  7: { raw: 5, prev: 1 },
  8: { raw: 5, prev: 1 },
}

const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t]))

export const typeOf = (typeId) => TYPE_BY_ID[typeId]
export const typeColor = (typeId) => TYPE_BY_ID[typeId]?.color ?? '#9aa5b1'

/** Resource ids look like `stone:5:raw` or `ore:8:refined`. */
export const makeId = (type, tier, kind) => `${type}:${tier}:${kind}`

export function parseId(id) {
  const [type, tier, kind] = id.split(':')
  return { type, tier: Number(tier), kind }
}

/** Display name, e.g. `stone:5:refined` → "T5 Brick". */
export function resourceName(id) {
  const { type, tier, kind } = parseId(id)
  const t = TYPE_BY_ID[type]
  if (!t) return id
  return `T${tier} ${kind === 'raw' ? t.raw : t.refined}`
}

/** Every refined resource, used by the drop-down. */
export const REFINED_RESOURCES = TIERS.flatMap((tier) =>
  TYPES.map((t) => ({
    id: makeId(t.id, tier, 'refined'),
    type: t.id,
    tier,
    kind: 'refined',
    name: `T${tier} ${t.refined}`,
    refined: t.refined,
    rawName: t.raw,
    color: t.color,
  })),
)

/**
 * Autocomplete filter. The query is split on whitespace and every token must
 * appear somewhere in "T5 Brick Stone stone t5 5", so "t5 bri", "brick",
 * "stone t5" and "5 cloth" all work.
 */
export function filterResources(query) {
  const q = query.trim().toLowerCase()
  if (!q) return REFINED_RESOURCES
  const tokens = q.split(/\s+/)
  return REFINED_RESOURCES.filter((r) => {
    const haystack = `${r.name} ${r.rawName} ${r.type} t${r.tier} ${r.tier}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}
