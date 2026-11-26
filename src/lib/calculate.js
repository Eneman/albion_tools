import { RECIPES, makeId, outputPerCraft, parseId, prevEnchantOf, TYPES } from '../data/resources.js'

const TYPE_ORDER = Object.fromEntries(TYPES.map((t, i) => [t.id, i]))

const numberFormat = new Intl.NumberFormat('en-US')
export const formatNumber = (n) => numberFormat.format(n)

/**
 * Walk the refining chain of `targetId` and compute, for every resource
 * involved, how much is needed in total, how much the user already has and
 * therefore how much is still missing.
 *
 * Possessions subtract at every level: if you already own half of the
 * intermediate refined resource, you do not need to craft it, so its raw
 * requirements drop too. Each resource appears at most once in a chain, so a
 * simple depth-first walk is enough.
 *
 * @param {string} targetId  e.g. `stone:5:refined` or `ore:4:refined@1`
 * @param {number} quantity  how many units of the target to obtain
 * @param {Record<string, string|number>} possessed  user-owned amounts per id
 * @returns {Array<{id: string, needed: number, possessed: number, missing: number}>}
 */
export function computeRequirements(targetId, quantity, possessed = {}) {
  const rows = new Map()

  const have = (id) => {
    const n = Math.floor(Number(possessed[id]))
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  const visit = (id, qty) => {
    if (qty <= 0) return
    const owned = have(id)
    const missing = Math.max(0, qty - owned)
    rows.set(id, { id, needed: qty, possessed: owned, missing })

    const { type, tier, kind, enchant } = parseId(id)
    if (kind !== 'refined') return // raw resources have no components

    const recipe = RECIPES[tier]
    const out = outputPerCraft(type, tier, enchant)
    // Crafts are whole batches: 4 wanted from a ×4 recipe is 1 craft, not 0.25.
    const crafts = Math.ceil(missing / out)

    // One craft always eats `raw` of the same grade's raw resource, and yields
    // `out` units against `out` of the previous tier's refined input — for
    // plain recipes both are 1, for enchanted stone both are 2/4/8.
    if (recipe.raw > 0) visit(makeId(type, tier, 'raw', enchant), crafts * recipe.raw)
    if (recipe.prev > 0) {
      visit(makeId(type, tier - 1, 'refined', prevEnchantOf(type, tier, enchant)), crafts * out)
    }
  }

  visit(targetId, Math.max(0, Math.floor(quantity)))

  // Top of the chain first: highest tier, refined before raw, stable type order.
  return [...rows.values()].sort((a, b) => {
    const pa = parseId(a.id)
    const pb = parseId(b.id)
    if (pb.tier !== pa.tier) return pb.tier - pa.tier
    if (pa.kind !== pb.kind) return pa.kind === 'refined' ? -1 : 1
    if (pb.enchant !== pa.enchant) return pb.enchant - pa.enchant
    return TYPE_ORDER[pa.type] - TYPE_ORDER[pb.type]
  })
}
