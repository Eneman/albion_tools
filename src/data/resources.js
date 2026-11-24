/**
 * Static game data: resource types, tiers, refining recipes and the official
 * in-game names and icons.
 *
 * Names are the English strings from the game's own localization dumps
 * (ao-data/ao-bin-dumps), icons come from Albion's official render service
 * (render.albiononline.com) and are stored locally in `public/icons/`.
 *
 * A refined resource always consumes:
 *  - `raw` units of the SAME tier raw resource
 *  - `prev` units of the PREVIOUS tier refined resource (0 at T2)
 */

export const TYPES = [
  { id: 'stone', label: 'Stone', color: '#9aa5b1', rawKey: 'ROCK', refinedKey: 'STONEBLOCK', legacy: 'Brick' },
  { id: 'wood', label: 'Wood', color: '#b07d46', rawKey: 'WOOD', refinedKey: 'PLANKS', legacy: 'Plank' },
  { id: 'hide', label: 'Hide', color: '#cf9355', rawKey: 'HIDE', refinedKey: 'LEATHER', legacy: 'Leather' },
  { id: 'cotton', label: 'Fiber', color: '#e8e2d2', rawKey: 'FIBER', refinedKey: 'CLOTH', legacy: 'Cloth' },
  { id: 'ore', label: 'Ore', color: '#8fa8bf', rawKey: 'ORE', refinedKey: 'METALBAR', legacy: 'Metal' },
]

export const TIERS = [2, 3, 4, 5, 6, 7, 8]

/** RECIPES[tier] = raw materials needed to refine 1 unit of that tier. */
export const RECIPES = {
  2: { raw: 1, prev: 0 },
  3: { raw: 2, prev: 1 },
  4: { raw: 2, prev: 1 },
  5: { raw: 3, prev: 1 },
  6: { raw: 4, prev: 1 },
  7: { raw: 5, prev: 1 },
  8: { raw: 5, prev: 1 },
}

/**
 * Official English item names, [0] = T2 … [6] = T8.
 * e.g. raw T4 stone is "Travertine", refined T4 stone is "Travertine Block".
 */
const OFFICIAL = {
  stone: {
    raw: ['Limestone', 'Sandstone', 'Travertine', 'Granite', 'Slate', 'Basalt', 'Marble'],
    refined: [
      'Limestone Block',
      'Sandstone Block',
      'Travertine Block',
      'Granite Block',
      'Slate Block',
      'Basalt Block',
      'Marble Block',
    ],
  },
  wood: {
    raw: ['Birch Logs', 'Chestnut Logs', 'Pine Logs', 'Cedar Logs', 'Bloodoak Logs', 'Ashenbark Logs', 'Whitewood Logs'],
    refined: [
      'Birch Planks',
      'Chestnut Planks',
      'Pine Planks',
      'Cedar Planks',
      'Bloodoak Planks',
      'Ashenbark Planks',
      'Whitewood Planks',
    ],
  },
  hide: {
    raw: ['Rugged Hide', 'Thin Hide', 'Medium Hide', 'Heavy Hide', 'Robust Hide', 'Thick Hide', 'Resilient Hide'],
    refined: [
      'Stiff Leather',
      'Thick Leather',
      'Worked Leather',
      'Cured Leather',
      'Hardened Leather',
      'Reinforced Leather',
      'Fortified Leather',
    ],
  },
  cotton: {
    raw: ['Cotton', 'Flax', 'Hemp', 'Skyflower', 'Amberleaf Cotton', 'Sunflax', 'Ghost Hemp'],
    refined: [
      'Simple Cloth',
      'Neat Cloth',
      'Fine Cloth',
      'Ornate Cloth',
      'Lavish Cloth',
      'Opulent Cloth',
      'Baroque Cloth',
    ],
  },
  ore: {
    raw: ['Copper Ore', 'Tin Ore', 'Iron Ore', 'Titanium Ore', 'Runite Ore', 'Meteorite Ore', 'Adamantium Ore'],
    refined: [
      'Copper Bar',
      'Bronze Bar',
      'Steel Bar',
      'Titanium Steel Bar',
      'Runite Steel Bar',
      'Meteorite Steel Bar',
      'Adamantium Steel Bar',
    ],
  },
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

/** Official name without tier, e.g. `stone:5:refined` → "Granite Block". */
export function baseName(id) {
  const { type, tier, kind } = parseId(id)
  return OFFICIAL[type]?.[kind]?.[tier - 2] ?? id
}

/** Display name with tier first, e.g. `stone:5:refined` → "T5 Granite Block". */
export function resourceName(id) {
  const { tier } = parseId(id)
  return `T${tier} ${baseName(id)}`
}

/** Game item unique name, e.g. `stone:5:refined` → "T5_STONEBLOCK". */
export function itemUniqueName(id) {
  const { type, tier, kind } = parseId(id)
  const t = TYPE_BY_ID[type]
  if (!t) return id
  return `T${tier}_${kind === 'raw' ? t.rawKey : t.refinedKey}`
}

/** Local icon path for a resource, e.g. `icons/T5_STONEBLOCK.png`. */
export function iconOf(id) {
  return `icons/${itemUniqueName(id)}.png`
}

/** Every refined resource, used by the drop-down. */
export const REFINED_RESOURCES = TIERS.flatMap((tier) =>
  TYPES.map((t) => {
    const id = makeId(t.id, tier, 'refined')
    return {
      id,
      type: t.id,
      tier,
      kind: 'refined',
      name: resourceName(id),
      baseName: baseName(id),
      rawName: OFFICIAL[t.id].raw[tier - 2],
      label: t.label,
      legacy: t.legacy,
      color: t.color,
      icon: iconOf(id),
    }
  }),
)

/**
 * Autocomplete filter. The query is split on whitespace and every token must
 * appear somewhere in the haystack, so "t5 gra", "block", "steel bar",
 * "ore t5" and the legacy "t5 brick" all work.
 */
export function filterResources(query) {
  const q = query.trim().toLowerCase()
  if (!q) return REFINED_RESOURCES
  const tokens = q.split(/\s+/)
  return REFINED_RESOURCES.filter((r) => {
    const haystack =
      `${r.name} ${r.baseName} ${r.rawName} ${r.label} ${r.type} ${r.legacy} t${r.tier} ${r.tier}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}
