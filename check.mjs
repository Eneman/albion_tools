// Quick sanity check for the refining chain math. Run with: node check.mjs
import { computeRequirements } from './src/lib/calculate.js'

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
//             → 20 T2 Stone
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
  eq(get('stone:2:raw'), 20, 'T2 Stone missing')
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
  eq(get('ore:2:raw'), 120, 'T2 Ore = 60 × 2')
}

// --- T2 has no previous refined -------------------------------------
{
  const rows = computeRequirements('cotton:2:refined', 7, {})
  eq(rows.length, 2, 'T2 Cloth: only itself + raw')
  eq(rows.find((r) => r.id === 'cotton:2:raw')?.missing, 14, 'T2 Cotton = 7 × 2')
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

console.log(process.exitCode ? '\nSome checks failed.' : '\nAll checks passed.')
