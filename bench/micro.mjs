#!/usr/bin/env node
/**
 * Micro-benchmark for the pure logic layer.
 *
 * `collectFacts` shells out to `git` (4 subprocesses), so it is measured
 * separately with fewer iterations; audit / readme / verify take facts as input
 * and are measured with the full iteration count.
 *
 *   node bench/micro.mjs [path]
 */

import { collectFacts } from '../logic/facts.mjs'
import { renderReadme } from '../logic/readme.mjs'
import { auditFacts } from '../logic/rubric.mjs'
import { getStyle } from '../logic/styles.mjs'
import { verifyFacts } from '../logic/verify.mjs'

const path = process.argv[2] ?? '.'
const iterations = Number(process.env.BENCH_ITERATIONS ?? 100)
const factsIterations = Number(process.env.BENCH_FACTS_ITERATIONS ?? 10)
const facts = collectFacts(path)
const style = getStyle('resolver')

/**
 * @param {() => void} fn
 * @param {number} count
 */
function bench(fn, count) {
  for (let index = 0; index < 10; index += 1) fn()
  const start = process.hrtime.bigint()
  for (let index = 0; index < count; index += 1) fn()
  return Number(process.hrtime.bigint() - start) / 1e6 / count
}

const audit = auditFacts(facts, 'resolver')
console.log(JSON.stringify({
  path,
  iterations,
  facts_iterations: factsIterations,
  facts_ms: round(bench(() => collectFacts(path), factsIterations)),
  audit_ms: round(bench(() => auditFacts(facts, 'resolver'), iterations)),
  readme_ms: round(bench(() => renderReadme(facts, style, 'zh'), iterations)),
  verify_ms: round(bench(() => verifyFacts(facts, 'resolver'), iterations)),
  score: audit.score,
  grade: audit.grade,
}, null, 2))

/** @param {number} value */
function round(value) {
  return Math.round(value * 100) / 100
}
