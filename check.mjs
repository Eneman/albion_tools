// Quick sanity check for the refining chain math. Run with: node check.mjs
import { computeRequirements } from './src/lib/calculate.js'
import {
  iconOf,
  isValidTarget,
  makeId,
  parseId,
  resourceName,
} from './src/data/resources.js'

const fail = (msg) => {
  console.error('FAIL:', msg)
  process.exitCode = 1
}
const eq = (actual, expected, label) => {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`)
  else console.log(`ok  ${label} = ${actual}`)
}

// --- T5 Brick, want 10, nothing owned -------------------------------
// 10 T5 Brick → 30 T5 Stone + 10 T4 Brick
//             → 20 T4 Stone + 10 T3 Brick
//             → 20 T3 Stone + 10 T2 Brick
//             → 10 T2 Stone (T2 refine = 1 raw)
{
  const rows = computeRequirements('stone:5:refined', 10, {})
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('stone:5:refined'), 10, 'T5 Brick missing')
  eq(get('stone:5:raw'), 30, 'T5 Stone missing')
  eq(get('stone:4:refined'), 10, 'T4 Brick missing')
  eq(get('stone:4:raw'), 20, 'T4 Stone missing')
  eq(get('stone:3:refined'), 10, 'T3 Brick missing')
  eq(get('stone:3:raw'), 20, 'T3 Stone missing')
  eq(get('stone:2:refined'), 10, 'T2 Brick missing')
  eq(get('stone:2:raw'), 10, 'T2 Stone missing (1 per refine)')
  eq(rows.length, 8, 'row count')
}

// --- Owning intermediates reduces what must be crafted ---------------
// Want 10 T5 Brick but already own 4 T4 Brick and 10 T3 Brick:
// T4 Brick to craft = 10 - 4 = 6 → 12 T4 Stone + 6 T3 Brick
// T3 Brick needed = 6, all owned → nothing below it.
{
  const rows = computeRequirements('stone:5:refined', 10, {
    'stone:4:refined': '4',
    'stone:3:refined': '10',
  })
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('stone:5:raw'), 30, 'T5 Stone still 30')
  eq(get('stone:4:refined'), 6, 'T4 Brick missing 6')
  eq(get('stone:4:raw'), 12, 'T4 Stone missing 12')
  eq(get('stone:3:refined'), 0, 'T3 Brick fully covered')
  eq(
    rows.some((r) => r.id === 'stone:3:raw'),
    false,
    'no T3 Stone row (T3 Brick needs no crafting)',
  )
  eq(rows.some((r) => r.id === 'stone:2:raw'), false, 'T2 chain dropped entirely')
}

// --- Owning the target itself ---------------------------------------
{
  const rows = computeRequirements('ore:8:refined', 100, { 'ore:8:refined': '40' })
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('ore:8:refined'), 60, 'T8 Metal: craft only 60')
  eq(get('ore:8:raw'), 300, 'T8 Ore = 60 × 5')
  eq(get('ore:7:refined'), 60, 'T7 Metal = 60')
  eq(get('ore:7:raw'), 300, 'T7 Ore = 60 × 5')
  eq(get('ore:6:raw'), 240, 'T6 Ore = 60 × 4')
  eq(get('ore:5:raw'), 180, 'T5 Ore = 60 × 3')
  eq(get('ore:4:raw'), 120, 'T4 Ore = 60 × 2')
  eq(get('ore:3:raw'), 120, 'T3 Ore = 60 × 2')
  eq(get('ore:2:raw'), 60, 'T2 Ore = 60 × 1')
}

// --- T2 has no previous refined -------------------------------------
{
  const rows = computeRequirements('cotton:2:refined', 7, {})
  eq(rows.length, 2, 'T2 Cloth: only itself + raw')
  eq(rows.find((r) => r.id === 'cotton:2:raw')?.missing, 7, 'T2 Cotton = 7 × 1')
}

// --- Quantity 0 / garbage input -------------------------------------
{
  eq(computeRequirements('wood:6:refined', 0, {}).length, 0, 'quantity 0 → no rows')
  eq(computeRequirements('wood:6:refined', -5, {}).length, 0, 'negative → no rows')
}

// --- Over-owning is clamped, never negative --------------------------
{
  const rows = computeRequirements('hide:4:refined', 5, { 'hide:4:raw': '999' })
  eq(rows.find((r) => r.id === 'hide:4:raw')?.missing, 0, 'over-owned raw → 0')
  eq(rows.find((r) => r.id === 'hide:4:refined')?.missing, 5, 'target still missing 5')
}

// --- Enchanted ids parse, round-trip and stay backward compatible ------
{
  eq(makeId('ore', 4, 'refined', 2), 'ore:4:refined@2', 'makeId appends @2')
  eq(makeId('ore', 4, 'refined', 0), 'ore:4:refined', 'grade 0 omits the suffix')
  const p = parseId('ore:4:refined@2')
  eq(p.type, 'ore', 'parseId type')
  eq(p.tier, 4, 'parseId tier')
  eq(p.kind, 'refined', 'parseId kind')
  eq(p.enchant, 2, 'parseId enchant')
  eq(parseId('stone:5:raw').enchant, 0, 'old ids read as grade 0')
  eq(parseId('stone:5:raw@2').kind, 'raw', 'raw ids carry a grade too')

  eq(isValidTarget('stone:5:refined@2'), true, 'stone target with a rock grade is valid')
  eq(isValidTarget('ore:4:refined@3'), true, 'T4 enchanted target is valid')
  eq(isValidTarget('ore:3:refined@1'), false, 'T3 has no enchanted variant')
  eq(isValidTarget('stone:9:refined'), false, 'unknown tier rejected')
}

// --- Names and icons of enchanted variants ----------------------------
{
  // T4 Fine Cloth, .1 — a real enchanted item with its own icon.
  eq(resourceName('cotton:4:refined@1'), 'T4 Uncommon Fine Cloth', 'EN enchanted name')
  eq(resourceName('cotton:4:refined@1', 'fr'), 'T4 Tissu délicat peu commun', 'FR enchanted name')
  eq(iconOf('cotton:4:refined@1'), 'icons/T4_CLOTH_LEVEL1.png', 'enchanted icon')
  eq(iconOf('ore:8:raw@3'), 'icons/T8_ORE_LEVEL3.png', 'enchanted raw icon')

  // Stone blocks are never enchanted: same icon and name as the plain block,
  // even though the id carries a grade (it describes the ROCK, not the block).
  eq(resourceName('stone:5:refined@2'), 'T5 Granite Block', 'stone name ignores grade')
  eq(iconOf('stone:5:refined@2'), 'icons/T5_STONEBLOCK.png', 'stone icon ignores grade')
  eq(resourceName('stone:5:raw@2'), 'T5 Rare Granite', 'stone rock name uses its grade')
  eq(iconOf('stone:5:raw@2'), 'icons/T5_ROCK_LEVEL2.png', 'stone rock icon uses its grade')
}

// --- T4 enchantment uses the PLAIN T3 input (T3 has no variants) ------
// 10 T4.1 Cloth → 20 T4.1 Fiber + 10 plain T3 Cloth
//               → 20 T3 Fiber + 10 T2 Cloth → 10 T2 Fiber
{
  const rows = computeRequirements('cotton:4:refined@1', 10, {})
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('cotton:4:refined@1'), 10, 'T4.1 Cloth missing')
  eq(get('cotton:4:raw@1'), 20, 'T4.1 Cotton = 10 × 2, same grade')
  eq(get('cotton:3:refined'), 10, 'T4.1 takes PLAIN T3 Cloth')
  eq(get('cotton:3:raw'), 20, 'T3 Cotton = 10 × 2')
  eq(get('cotton:2:refined'), 10, 'T2 Cloth = 10')
  eq(get('cotton:2:raw'), 10, 'T2 Cotton = 10 × 1')
  eq(rows.length, 6, 'T4.1 row count')
}

// --- From T5 up the grade propagates down to T4, then stops at T3 -----
{
  const rows = computeRequirements('ore:6:refined@2', 5, {})
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('ore:6:raw@2'), 20, 'T6.2 Ore = 5 × 4')
  eq(get('ore:5:refined@2'), 5, 'prev tier keeps grade .2')
  eq(get('ore:5:raw@2'), 15, 'T5.2 Ore = 5 × 3')
  eq(get('ore:4:refined@2'), 5, 'T4.2 input keeps grade .2')
  eq(get('ore:4:raw@2'), 10, 'T4.2 Titanium Ore = 5 × 2')
  eq(get('ore:3:refined'), 5, 'grade drops at T3 (no T3 variants)')
  eq(get('ore:3:raw'), 10, 'plain T3 Ore = 5 × 2')
  eq(get('ore:2:raw'), 5, 'plain T2 Ore = 5 × 1')
  eq(rows.some((r) => r.id === 'ore:3:refined@2'), false, 'no T3.2 row exists')
}

// --- Owning the enchanted target counts --------------------------------
{
  const rows = computeRequirements('ore:4:refined@1', 10, { 'ore:4:refined@1': '4' })
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('ore:4:refined@1'), 6, 'craft only the 6 still missing')
  eq(get('ore:4:raw@1'), 12, 'T4.1 Titanium Ore = 6 × 2')
  eq(get('ore:3:refined'), 6, 'plain T3 input = 6')
}

// --- Stone: enchanted rocks multiply the output ------------------------
// 100 T5 Blocks from .2 rocks: one craft = 3 rocks + 4 T4 blocks → 4 blocks
// → 25 crafts → 75 T5.2 Granite + 100 plain T4 Granite Block
{
  const rows = computeRequirements('stone:5:refined@2', 100, {})
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('stone:5:refined@2'), 100, 'T5 Block missing')
  eq(get('stone:5:raw@2'), 75, 'T5.2 Granite = ceil(100/4) × 3')
  eq(get('stone:4:refined'), 100, 'plain T4 Block = 1 per block out')
  eq(get('stone:4:raw'), 200, 'T4 Granite = 100 × 2')
  eq(get('stone:2:raw'), 100, 'T2 Granite = 100 × 1')
  eq(rows.length, 8, 'stone .2 row count')
}

// --- Stone: crafts are whole batches -----------------------------------
// 5 wanted from a ×4 recipe = 2 crafts → 6 rocks + 8 T4 blocks (→ 8 blocks)
{
  const rows = computeRequirements('stone:5:refined@2', 5, {})
  const get = (id) => rows.find((r) => r.id === id)?.missing
  eq(get('stone:5:raw@2'), 6, 'ceil(5/4) × 3 rocks')
  eq(get('stone:4:refined'), 8, 'ceil(5/4) × 4 T4 blocks')
}

// --- Stone .1 / .3 multipliers, and plain stone unchanged --------------
{
  eq(
    computeRequirements('stone:6:refined@1', 8, {}).find((r) => r.id === 'stone:6:raw@1')?.missing,
    16,
    'T6 .1: ceil(8/2) × 4 rocks',
  )
  eq(
    computeRequirements('stone:8:refined@3', 8, {}).find((r) => r.id === 'stone:8:raw@3')?.missing,
    5,
    'T8 .3: ceil(8/8) × 5 rocks',
  )
  eq(
    computeRequirements('stone:8:refined@3', 8, {}).find((r) => r.id === 'stone:7:refined')
      ?.missing,
    8,
    'T8 .3 needs 8 plain T7 blocks',
  )
  eq(
    computeRequirements('stone:8:refined', 8, {}).find((r) => r.id === 'stone:8:raw')?.missing,
    40,
    'plain T8 stone untouched: 8 × 5',
  )
}

console.log(process.exitCode ? '\nSome checks failed.' : '\nAll checks passed.')
