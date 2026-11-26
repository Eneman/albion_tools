import { computeRequirements, sortRows } from './calculate.js'
import { RECIPES, TIERS, TYPES, makeId } from '../data/resources.js'

const amount = (value) => {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Bulk mode: given the raw stock the user owns (keyed by raw resource id),
 * work out, for every type that has stock, how far the refining chain can
 * climb and what it takes to get there.
 *
 * The climb targets the highest tier the user holds raw for — that top stock
 * is what everything below it is converted into, so the output quantity is the
 * number of whole crafts the top stock affords. Each type's chain is then
 * derived with the regular requirements walker, the whole stock counting as
 * possessed at every level; shortfalls simply land in the missing list.
 *
 * Grades stay at .0: bulk converts plain resources.
 *
 * @param {Record<string, string|number>} owned raw amounts keyed by id
 * @returns {Array<{type: string, tier: number, targetId: string, quantity: number, rows: Array}>}
 */
export function bulkPlan(owned) {
  const plans = []

  for (const { id: type } of TYPES) {
    // Highest tier the user actually holds raw for.
    let topTier = 0
    for (const tier of TIERS) {
      if (amount(owned[makeId(type, tier, 'raw')]) > 0) topTier = tier
    }
    if (topTier === 0) continue

    const topRaw = amount(owned[makeId(type, topTier, 'raw')])
    // Crafts are whole batches: stock below one craft's worth still plans a
    // single craft — the shortfall shows up as missing rather than vanishing.
    const quantity = Math.max(1, Math.floor(topRaw / RECIPES[topTier].raw))
    const targetId = makeId(type, topTier, 'refined')

    plans.push({
      type,
      tier: topTier,
      targetId,
      quantity,
      rows: computeRequirements(targetId, quantity, owned),
    })
  }

  return plans
}

/**
 * Merge every plan's rows into the one list MissingList renders. One plan per
 * type means ids never collide across plans, but summing keeps the merge safe
 * if that ever changes. MissingList filters the raw rows itself.
 *
 * @param {ReturnType<typeof bulkPlan>} plans
 */
export function bulkMissing(plans) {
  const byId = new Map()

  for (const plan of plans) {
    for (const row of plan.rows) {
      const existing = byId.get(row.id)
      if (existing) {
        existing.needed += row.needed
        existing.possessed += row.possessed
        existing.missing += row.missing
      } else {
        byId.set(row.id, { ...row })
      }
    }
  }

  return sortRows([...byId.values()])
}
