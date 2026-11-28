import { OFFICIAL_FR } from './resources.fr.js'
import { ENCHANTED_NAMES } from './resources.enchant.js'

/**
 * Static game data: resource types, tiers, refining recipes and the official
 * in-game names and icons in English and French.
 *
 * Names are the English and French strings from the game's own localization
 * dumps (ao-data/ao-bin-dumps), icons come from Albion's official render
 * service (render.albiononline.com) and are stored locally in `public/icons/`.
 *
 * A refined resource always consumes:
 *  - `raw` units of the SAME tier raw resource
 *  - `prev` units of the PREVIOUS tier refined resource (0 at T2)
 *
 * Enchanted grades (`.1`…`.4`) are appended to the id as `@1`…`@4` —
 * `ore:4:refined@1` — and only exist for T4–T8. Stone blocks carry no
 * enchantment themselves: an enchant level on a stone block id selects the
 * grade of ROCK it is refined from — and stone stops at `.3`, the game has
 * no pristine (`.4`) rocks.
 */

export const LANGS = ['en', 'fr']

export const TYPES = [
  { id: 'stone', label: 'Stone', labelFr: 'Pierre', color: '#9aa5b1', rawKey: 'ROCK', refinedKey: 'STONEBLOCK', legacy: 'Brick' },
  { id: 'wood', label: 'Wood', labelFr: 'Bois', color: '#b07d46', rawKey: 'WOOD', refinedKey: 'PLANKS', legacy: 'Plank' },
  { id: 'hide', label: 'Hide', labelFr: 'Cuir', color: '#cf9355', rawKey: 'HIDE', refinedKey: 'LEATHER', legacy: 'Leather' },
  { id: 'cotton', label: 'Fiber', labelFr: 'Fibre', color: '#e8e2d2', rawKey: 'FIBER', refinedKey: 'CLOTH', legacy: 'Cloth' },
  { id: 'ore', label: 'Ore', labelFr: 'Minerai', color: '#8fa8bf', rawKey: 'ORE', refinedKey: 'METALBAR', legacy: 'Metal' },
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

/** Enchantment grades, `.1` to `.4` (`.0` = plain, unenchanted). */
export const ENCHANTS = [0, 1, 2, 3, 4]

/**
 * Highest enchantment grade a resource type supports.
 *
 * Everything goes to `.4` (Pristine) from T4 up — except stone: the game has
 * no pristine rocks, so stone stops at `.3` like it always has.
 */
export const maxEnchantOf = (type) => (type === 'stone' ? 3 : 4)

/**
 * Whether an item exists in enchanted form.
 *
 * Enchanted variants only exist from T4 upwards — the game has no enchanted
 * T2/T3 resources — and stone blocks never have one: stone is enchanted at the
 * ROCK, not at the block. So a stone target carrying an enchant level means
 * "refined from that grade of rock", and its name and icon stay those of the
 * plain block. The grade itself is capped by `maxEnchantOf`.
 */
export function hasEnchantedVariant(type, kind, tier) {
  return tier >= 4 && !(type === 'stone' && kind === 'refined')
}

/**
 * Enchant grades selectable for a given tier and type
 * (T2/T3 offer only `.0`; stone stops at `.3`).
 */
export function enchantOptions(tier, type) {
  if (tier < 4) return [0]
  return ENCHANTS.filter((grade) => grade <= maxEnchantOf(type))
}

/**
 * How many units ONE craft produces.
 *
 * Every recipe yields 1 unit except stone with an enchanted rock: stone blocks
 * cannot be enchanted, so the game instead multiplies the yield — `.1` → 2,
 * `.2` → 4, `.3` → 8 (and `.4` would be ×16, though pristine rocks do not
 * exist) — consuming proportionally more of the previous tier's plain blocks
 * (verified against the game's own crafting data).
 */
export function outputPerCraft(type, tier, enchant) {
  return type === 'stone' && enchant > 0 ? 2 ** enchant : 1
}

/**
 * Enchant grade of the PREVIOUS tier's refined input for a given target.
 *
 * The previous tier carries the same grade — except at T4, whose previous tier
 * is T3 and T3 has no enchanted variants at all, so T4 refinement always takes
 * the plain T3 input. Stone never propagates: its inputs are plain blocks.
 */
export function prevEnchantOf(type, tier, enchant) {
  if (type === 'stone' || tier < 5) return 0
  return enchant
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

/** Names per language: NAMES.fr comes straight from the game's FR dump. */
const NAMES = { en: OFFICIAL, fr: OFFICIAL_FR }

export const typeOf = (typeId) => TYPE_BY_ID[typeId]
export const typeColor = (typeId) => TYPE_BY_ID[typeId]?.color ?? '#9aa5b1'

/** Resource ids look like `stone:5:raw` or `ore:8:refined@2` (grade 0 omits `@…`). */
export const makeId = (type, tier, kind, enchant = 0) =>
  `${type}:${tier}:${kind}${enchant > 0 ? `@${enchant}` : ''}`

export function parseId(id) {
  const [type, tier, rest = ''] = id.split(':')
  const at = rest.indexOf('@')
  const kind = at === -1 ? rest : rest.slice(0, at)
  const enchant = at === -1 ? 0 : Number(rest.slice(at + 1)) || 0
  return { type, tier: Number(tier), kind, enchant }
}

/** True when `id` is a target the refined drop-down can legitimately produce. */
export function isValidTarget(id) {
  const { type, tier, kind, enchant } = parseId(id)
  if (kind !== 'refined' || !TYPE_BY_ID[type] || !TIERS.includes(tier)) return false
  return enchant === 0 || (tier >= 4 && enchant <= maxEnchantOf(type))
}

/** Official name without tier, e.g. `stone:5:refined` / 'fr' → "Bloc de granite". */
export function baseName(id, lang = 'en') {
  const { type, tier, kind, enchant } = parseId(id)
  if (enchant > 0 && enchant <= maxEnchantOf(type) && hasEnchantedVariant(type, kind, tier)) {
    const enchanted = ENCHANTED_NAMES[lang]?.[type]?.[kind]?.[tier]?.[enchant]
    if (enchanted) return enchanted
  }
  return NAMES[lang]?.[type]?.[kind]?.[tier - 2] ?? NAMES.en[type]?.[kind]?.[tier - 2] ?? id
}

/** Display name with tier first, e.g. `ore:4:refined@1` → "T4 Uncommon Fine Cloth". */
export function resourceName(id, lang = 'en') {
  const { tier } = parseId(id)
  return `T${tier} ${baseName(id, lang)}`
}

/** Game item unique name, e.g. `ore:4:refined@1` → "T4_CLOTH_LEVEL1". */
export function itemUniqueName(id) {
  const { type, tier, kind, enchant } = parseId(id)
  const t = TYPE_BY_ID[type]
  if (!t) return id
  const base = `T${tier}_${kind === 'raw' ? t.rawKey : t.refinedKey}`
  return enchant > 0 && enchant <= maxEnchantOf(type) && hasEnchantedVariant(type, kind, tier)
    ? `${base}_LEVEL${enchant}`
    : base
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
      nameFr: resourceName(id, 'fr'),
      baseNameFr: baseName(id, 'fr'),
      rawName: OFFICIAL[t.id].raw[tier - 2],
      rawNameFr: OFFICIAL_FR[t.id].raw[tier - 2],
      label: t.label,
      labelFr: t.labelFr,
      legacy: t.legacy,
      color: t.color,
      icon: iconOf(id),
    }
  }),
)

/**
 * Autocomplete filter. The query is split on whitespace and every token must
 * appear somewhere in the haystack, so "t5 gra", "block", "steel bar",
 * "travertin", "bloc de" and the legacy "t5 brick" all work — in either
 * language, regardless of the current UI language.
 */
export function filterResources(query) {
  const q = query.trim().toLowerCase()
  if (!q) return REFINED_RESOURCES
  const tokens = q.split(/\s+/)
  return REFINED_RESOURCES.filter((r) => {
    const haystack =
      `${r.name} ${r.baseName} ${r.nameFr} ${r.baseNameFr} ` +
      `${r.rawName} ${r.rawNameFr} ${r.label} ${r.labelFr} ${r.type} ${r.legacy} ` +
      `t${r.tier} ${r.tier}`
    const lower = haystack.toLowerCase()
    return tokens.every((token) => lower.includes(token))
  })
}
