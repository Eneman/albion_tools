import { computeRequirements, sortRows } from './calculate.js'
import { RECIPES, TIERS, TYPES, makeId } from '../data/resources.js'

/** Enchantment grades — .0 is the plain resource, .1–.4 exist from T4 up. */
export const GRADES = [0, 1, 2, 3, 4]

/** Stone has no pristine rocks: its grades stop at .3. */
const STONE_GRADES = [0, 1, 2, 3]

/** Grades a type's raw stock can come in (see `STONE_GRADES`). */
export const gradesFor = (type) => (type === 'stone' ? STONE_GRADES : GRADES)

const amount = (value) => {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Bulk mode: given the raw stock the user owns (keyed by raw resource id,
 * enchantment included), work out what each type can be refined into and
 * everything still missing to get there.
 *
 * Non-stone types climb once per grade that has stock — enchanted raws
 * (.1–.4) refine into their own grade and each grade forms its own chain.
 * The chains only meet at the plain T3/T2 bottom, so they are walked one
 * after another against a shared copy of the inventory: each walk may only
 * spend what the previous ones left behind, which keeps shared raws from
 * being counted twice.
 *
 * Stone is different: blocks are never enchanted, so every grade of rock
 * feeds plain block production — enchanted rocks just yield ×2 / ×4 / ×8
 * blocks per craft. The top tier's output is derived from all the rock stock
 * held there; below it the walk meets a fixed block demand, spending
 * enchanted rocks first (never overshooting, so the previous tier's input
 * stays 1:1) and topping up with plain ones.
 *
 * @param {Record<string, string|number>} owned raw amounts keyed by id
 * @returns {{ plans: Array<{type: string, tier: number, grade: number, targetId: string, quantity: number}>, rows: Array<{id: string, needed: number, possessed: number, missing: number}>}}
 */
export function bulkCompute(owned) {
  const plans = []
  const rowsById = new Map()
  // Working copy of the stock: every chain spends from it as it walks.
  const inv = { ...owned }

  const absorb = (rows) => {
    for (const row of rows) {
      const seen = rowsById.get(row.id)
      if (seen) {
        seen.needed += row.needed
        // Possessions may never exceed the real stock, however many chains
        // looked at the same id.
        seen.possessed = Math.min(seen.possessed + row.possessed, amount(owned[row.id]))
        seen.missing += row.missing
      } else {
        rowsById.set(row.id, { ...row })
      }
      const left = amount(inv[row.id])
      if (left > 0) inv[row.id] = String(left - Math.min(left, row.needed))
    }
  }

  for (const { id: type } of TYPES) {
    if (type === 'stone') {
      const plan = stonePlan(inv)
      if (plan) {
        plans.push(plan)
        absorb(stoneRows(plan, inv))
      }
      continue
    }
    for (const grade of gradesFor(type)) {
      const chain = gradeChain(type, grade, inv)
      if (!chain) continue
      plans.push(chain)
      absorb(computeRequirements(chain.targetId, chain.quantity, inv))
    }
  }

  return { plans, rows: sortRows([...rowsById.values()]) }
}

/**
 * One chain per grade: the highest tier holding raw of that grade, refined
 * into that grade, in the number of whole crafts the stock affords.
 */
function gradeChain(type, grade, owned) {
  const tiers = grade === 0 ? TIERS : TIERS.filter((tier) => tier >= 4)
  let topTier = 0
  for (const tier of tiers) {
    if (amount(owned[makeId(type, tier, 'raw', grade)]) > 0) topTier = tier
  }
  if (topTier === 0) return null

  const stock = amount(owned[makeId(type, topTier, 'raw', grade)])
  // Crafts are whole batches: stock below one craft's worth still plans a
  // single craft — the shortfall shows up as missing rather than vanishing.
  const quantity = Math.max(1, Math.floor(stock / RECIPES[topTier].raw))

  return {
    type,
    tier: topTier,
    grade,
    targetId: makeId(type, topTier, 'refined', grade),
    quantity,
  }
}

/**
 * Stone's single plan: every grade of rock at the top tier converts into
 * plain blocks, so the output is the sum of what each grade's whole crafts
 * yield. With less than one craft of anything, plan one craft of the grade
 * closest to affording it.
 */
function stonePlan(owned) {
  let topTier = 0
  const grades = gradesFor('stone')
  for (const tier of TIERS) {
    if (grades.some((grade) => amount(owned[makeId('stone', tier, 'raw', grade)]) > 0)) {
      topTier = tier
    }
  }
  if (topTier === 0) return null

  const rawCount = RECIPES[topTier].raw
  const crafts = {}
  let blocks = 0
  for (const grade of grades) {
    const count = Math.floor(amount(owned[makeId('stone', topTier, 'raw', grade)]) / rawCount)
    crafts[grade] = count
    blocks += count * 2 ** grade
  }

  if (blocks === 0) {
    let best = 0
    for (const grade of [1, 2, 3]) {
      if (amount(owned[makeId('stone', topTier, 'raw', grade)]) > amount(owned[makeId('stone', topTier, 'raw', best)])) {
        best = grade
      }
    }
    crafts[best] = 1
    blocks = 2 ** best
  }

  return {
    type: 'stone',
    tier: topTier,
    grade: 0,
    targetId: makeId('stone', topTier, 'refined'),
    quantity: blocks,
    crafts,
  }
}

/**
 * Raw-material rows for a stone plan: the top tier's rocks (one row per
 * grade crafted), then one row per tier below. Each tier below must yield
 * exactly the same block count as the tier above consumed (the previous
 * input is 1:1 with the output for every grade), so the demand never
 * changes on the way down.
 */
function stoneRows(plan, owned) {
  const rows = []
  const { type, tier, crafts, quantity } = plan
  const push = (id, needed) => {
    const possessed = amount(owned[id])
    rows.push({ id, needed, possessed, missing: Math.max(0, needed - possessed) })
  }

  for (const grade of gradesFor('stone')) {
    const count = crafts[grade] ?? 0
    if (count > 0) push(makeId(type, tier, 'raw', grade), count * RECIPES[tier].raw)
  }

  for (let t = tier - 1; t >= 2; t--) {
    const rawCount = RECIPES[t].raw
    let remaining = quantity
    // Enchanted rocks first — more blocks per craft — but only whole crafts
    // that fit the demand, so nothing is overproduced.
    for (const grade of [3, 2, 1]) {
      if (t < 4) break // no enchanted rocks below T4
      const id = makeId(type, t, 'raw', grade)
      const stock = amount(owned[id])
      const count = Math.min(Math.floor(stock / rawCount), Math.floor(remaining / 2 ** grade))
      if (count > 0) {
        push(id, count * rawCount)
        remaining -= count * 2 ** grade
      }
    }
    // Plain rocks finish the demand exactly.
    if (remaining > 0) push(makeId(type, t, 'raw', 0), remaining * rawCount)
  }

  return rows
}
