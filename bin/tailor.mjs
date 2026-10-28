#!/usr/bin/env node
/**
 * CLI for dsh-plugin-tailor.
 *
 * The plugin exposes the same logic as DSH tools; this binary makes the
 * pipeline usable in a terminal, in CI, and in demo recordings.
 *
 * Usage:
 *   node bin/tailor.mjs styles
 *   node bin/tailor.mjs audit  [path] [--style=id]
 *   node bin/tailor.mjs plan   [path] [--style=id] [--limit=20]
 *   node bin/tailor.mjs readme [path] [--style=id] [--lang=zh|en|both] [--apply] [--force]
 *   node bin/tailor.mjs brand  [path] [--style=id] [--concept=id] [--apply] [--force]
 *   node bin/tailor.mjs verify [path] [--style=id]
 */

import { repoAudit, repoBrand, repoPlan, repoReadme, repoStyles, repoVerify } from '../logic/api.js'

const COMMANDS = new Set(['styles', 'audit', 'plan', 'readme', 'brand', 'verify'])

/**
 * @param {string[]} argv
 * @returns {{ command: string, path: string, options: Record<string, any> }}
 */
function parseArgs(argv) {
  const [command, ...rest] = argv
  /** @type {Record<string, any>} */
  const options = {}
  let path = '.'
  for (const token of rest) {
    if (token.startsWith('--')) {
      const [key, rawValue] = token.slice(2).split('=')
      if (key === 'apply' || key === 'force') options[key] = rawValue === undefined ? true : rawValue !== 'false'
      else if (key === 'limit') options.limit = Number(rawValue)
      else options[key] = rawValue ?? true
    } else if (path === '.') {
      path = token
    }
  }
  return { command, path, options }
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    printHelp()
    return
  }
  const { command, path, options } = parseArgs(argv)
  if (!COMMANDS.has(command)) {
    console.error(`unknown command: ${command}`)
    printHelp()
    process.exitCode = 1
    return
  }
  const style = typeof options.style === 'string' ? options.style : 'resolver'
  const lang = typeof options.lang === 'string' ? options.lang : 'both'
  const args = {
    path,
    style,
    lang,
    concept: typeof options.concept === 'string' ? options.concept : undefined,
    tagline: typeof options.tagline === 'string' ? options.tagline : undefined,
    apply: options.apply === true,
    force: options.force === true,
    limit: Number.isFinite(options.limit) ? options.limit : undefined,
  }
  const ctx = null
  const manager = null
  const pluginOptions = { defaultStyle: 'resolver' }

  let result
  if (command === 'styles') result = await repoStyles(ctx, manager, pluginOptions, args)
  else if (command === 'audit') result = await repoAudit(ctx, manager, pluginOptions, args)
  else if (command === 'plan') result = await repoPlan(ctx, manager, pluginOptions, args)
  else if (command === 'readme') result = await repoReadme(ctx, manager, pluginOptions, args)
  else if (command === 'brand') result = await repoBrand(ctx, manager, pluginOptions, args)
  else result = await repoVerify(ctx, manager, pluginOptions, args)

  process.stdout.write(`${result.text}\n`)
}

function printHelp() {
  process.stdout.write(`dsh-plugin-tailor CLI

  styles                     list the README style presets
  audit  [path] [--style=]  score a repository and list gaps
  plan   [path] [--style=]  ordered tasks with acceptance criteria
  readme [path] [--style=] [--lang=zh|en|both] [--apply] [--force]
  brand  [path] [--style=] [--concept=needle|stitch|quill|arcs|orbit|prompt|bubble|radar|hexstack|monogram|spark|layers] [--apply] [--force]
  verify [path] [--style=]  audit + link/anchor/image checks

Examples:
  node bin/tailor.mjs audit .
  node bin/tailor.mjs readme . --style=terminal --lang=both
  node bin/tailor.mjs brand . --style=playful --apply
  node bin/tailor.mjs brand . --style=evidence --concept=needle --apply --force
  node bin/tailor.mjs verify . --style=product
`)
}

main().catch((error) => {
  console.error(`tailor failed: ${error?.message ?? String(error)}`)
  process.exitCode = 1
})
