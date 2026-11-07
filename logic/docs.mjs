/**
 * Static docs site for the agent layer.
 *
 * Renders `docs/*.md` into a small, dependency-free HTML site with one agent
 * entry (llms.txt / agent.json) and one human entry (the reference pages).
 * Only the Markdown features the reference docs actually use are supported.
 */

import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const MARKER = '<!-- generated-by: dsh-plugin-tailor repo_agent -->'

/** @param {string} value */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** @param {string} value */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[`*_[\](){}:;,.!?'"“”‘’·]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** @param {string} text */
function inline(text) {
  let value = escapeHtml(text)
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>')
  value = value.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  value = value.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  return value
}

/**
 * Minimal Markdown to HTML. Supports headings, fenced code, tables, lists,
 * blockquotes, horizontal rules, paragraphs and inline code/links/images.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function renderMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let paragraph = []
  let list = null
  let code = null
  let table = null

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    out.push(`<p>${inline(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    out.push(`<${list.tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.tag}>`)
    list = null
  }
  const flushTable = () => {
    if (!table) return
    const header = table.rows[0] ?? []
    const body = table.rows.slice(1)
    out.push('<table><thead><tr>' + header.map((cell) => `<th>${inline(cell)}</th>`).join('') + '</tr></thead><tbody>'
      + body.map((row) => '<tr>' + row.map((cell) => `<td>${inline(cell)}</td>`).join('') + '</tr>').join('')
      + '</tbody></table>')
    table = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = line.match(/^```\s*([\w-]*)\s*$/)
    if (code !== null) {
      if (fence) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
        code = null
      } else code.push(line)
      continue
    }
    if (fence) {
      flushParagraph(); flushList(); flushTable()
      code = []
      continue
    }
    if (line.trim() === '') {
      flushParagraph(); flushList(); flushTable()
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (heading) {
      flushParagraph(); flushList(); flushTable()
      const level = heading[1].length
      const id = slugify(heading[2])
      out.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`)
      continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph(); flushList(); flushTable()
      out.push('<hr>')
      continue
    }
    if (/^>\s?/.test(line)) {
      flushParagraph(); flushList(); flushTable()
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`)
      continue
    }
    if (/^\|.*\|$/.test(line.trim())) {
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
      if (!table) {
        table = { rows: [cells] }
        flushParagraph(); flushList()
      } else if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) table.rows.push(cells)
      continue
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph(); flushTable()
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] } }
      list.items.push(line.replace(/^\s*[-*+]\s+/, ''))
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph(); flushTable()
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] } }
      list.items.push(line.replace(/^\s*\d+\.\s+/, ''))
      continue
    }
    if (table) flushTable()
    paragraph.push(line.trim())
  }
  if (code !== null) out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  flushParagraph(); flushList(); flushTable()
  return out.join('\n')
}

/** @param {any} style */
function theme(style) {
  const brand = style?.palette?.brand ?? '#4D6BFE'
  const ink = style?.palette?.ink ?? '#0B1020'
  const green = style?.palette?.green ?? '#2FBF71'
  return { brand, ink, green }
}

/** @param {any} style */
export function siteCss(style) {
  const { brand, ink, green } = theme(style)
  return `/* generated by dsh-plugin-tailor repo_agent */
:root{--paper:#f2efe6;--ink:${ink};--muted:#5b564c;--soft:#8b8578;--brand:${brand};--green:${green};--line:#d8d2c4;--code:#14161f}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.7 "Segoe UI","Microsoft YaHei",Arial,sans-serif}
a{color:var(--brand);text-decoration:none}a:hover{text-decoration:underline}
.wrap{display:grid;grid-template-columns:260px minmax(0,860px);gap:64px;max-width:1240px;margin:0 auto;padding:48px 32px 96px}
nav{position:sticky;top:40px;align-self:start}
nav .brand{display:flex;align-items:center;gap:10px;margin-bottom:28px;font-weight:700;font-size:20px;letter-spacing:-.5px}
nav .brand a{color:var(--ink)}
nav .kicker{font-size:11px;letter-spacing:4px;color:var(--soft);margin-bottom:10px}
nav a.item{display:block;padding:5px 0;color:var(--muted);font-size:14px}
nav a.item.on{color:var(--ink);font-weight:600}
nav .agents{margin-top:28px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--soft);line-height:1.8}
nav .agents a{display:block}
main{min-width:0}
h1{font-size:44px;line-height:1.1;letter-spacing:-1.8px;margin:0 0 12px;font-weight:700}
h2{font-size:24px;margin:40px 0 10px;letter-spacing:-.6px}
h3{font-size:18px;margin:28px 0 8px}
p,li{color:#2f2b26}
.lede{font-size:18px;color:var(--muted);margin:0 0 28px;max-width:640px}
.agentbar{border:1px solid var(--line);border-radius:12px;padding:14px 18px;font-size:13px;color:var(--muted);margin:0 0 34px;background:#faf8f2}
.agentbar b{color:var(--ink)}
table{border-collapse:collapse;width:100%;margin:16px 0;font-size:14px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--soft);font-weight:600;font-size:12px;letter-spacing:.5px}
code{background:#e8e3d6;padding:1px 5px;border-radius:4px;font-size:.9em}
pre{background:var(--code);color:#e7e3d8;padding:16px 18px;border-radius:10px;overflow:auto;font-size:13px;line-height:1.55}
pre code{background:none;padding:0;color:inherit}
blockquote{margin:16px 0;padding:2px 0 2px 16px;border-left:3px solid var(--line);color:var(--muted)}
img{max-width:100%}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0 8px}
.card{display:block;border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:#faf8f2;color:var(--ink)}
.card b{display:block;font-size:15px;margin-bottom:4px}
.card span{font-size:13px;color:var(--muted)}
.card:hover{border-color:var(--brand);text-decoration:none}
footer{margin-top:60px;padding-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--soft)}
@media(max-width:900px){.wrap{grid-template-columns:1fr;gap:28px}nav{position:static}.cards{grid-template-columns:1fr}}
`
}

/** @param {any} facts @param {any} style */
function docsSource(facts) {
  if (!facts.docs.dir) return []
  return facts.docs.files
    .filter((file) => file.toLowerCase().endsWith('.md'))
    .map((file) => {
      const full = join(facts.root, file)
      const text = readFileSync(full, 'utf8')
      const titleMatch = text.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1].trim() : basename(file, '.md')
      return { file, slug: basename(file, '.md').toLowerCase(), title, text }
    })
}

/**
 * @param {any} facts
 * @param {any} style
 * @param {{ docsDir?: string }} [options]
 * @returns {{ files: { path: string, content: string }[], pages: { slug: string, title: string, file: string }[], todos: string[], warnings: string[] }}
 */
export function buildDocsSite(facts, style, options = {}) {
  const docsDir = options.docsDir ?? facts.docs.dir ?? 'docs'
  const pages = docsSource(facts)
  const todos = []
  const warnings = []
  if (pages.length === 0) todos.push(`No docs/*.md found. Add reference pages, then run repo_agent again; the index is still generated with the agent entry.`)
  if (!facts.repo) todos.push('No repository URL in package.json; the docs pages link to GitHub only when repository is set.')

  const nav = pages.map((page) => `<a class="item" href="${page.slug}.html">${escapeHtml(page.title)}</a>`).join('')
  const repoLink = facts.repo ? `<a href="${escapeHtml(facts.repo)}">Repository</a>` : ''
  const agentLinks = `<div class="agents"><b>Agent?</b><a href="../llms.txt">llms.txt</a><a href="../agent.json">agent.json</a>${repoLink}</div>`
  const page = (title, body, active) => `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · ${escapeHtml(facts.name)} reference</title><link rel="stylesheet" href="style.css">${MARKER}</head><body><div class="wrap">
<nav><div class="brand"><a href="index.html">${escapeHtml(facts.name)}</a></div><div class="kicker">REFERENCE</div><a class="item${active === 'index' ? ' on' : ''}" href="index.html">总览</a>${nav}${agentLinks}</nav>
<main><div class="agentbar"><b>For agents:</b> start with <a href="../llms.txt">llms.txt</a>, full contract in <a href="../agent.json">agent.json</a>. This page is the human reference.</div>${body}<footer>${facts.version ? `v${escapeHtml(facts.version)} · ` : ''}${facts.repo ? `<a href="${escapeHtml(facts.repo)}">${escapeHtml(facts.name)}</a> · ` : ''}<a href="index.html">Reference</a></footer></main></div></body></html>`

  const files = []
  const pageList = []
  for (const entry of pages) {
    const html = renderMarkdown(entry.text)
    files.push({ path: join(docsDir, `${entry.slug}.html`), content: page(entry.title, html, entry.slug) })
    pageList.push({ slug: entry.slug, title: entry.title, file: entry.file })
  }

  const cards = pageList.map((entry) => `<a class="card" href="${entry.slug}.html"><b>${escapeHtml(entry.title)}</b><span>${escapeHtml(entry.file)}</span></a>`).join('')
  const index = `<h1>${escapeHtml(facts.name)} reference</h1><p class="lede">${escapeHtml(facts.description || facts.readme.firstParagraph || 'Reference for this repository.')}</p>
<div class="cards"><a class="card" href="../llms.txt"><b>I'm an agent</b><span>llms.txt: install, tools, rules, validation.</span></a><a class="card" href="../agent.json"><b>Machine contract</b><span>agent.json: tool contract, writes, validation.</span></a></div>
<h2>Reference pages</h2>${cards ? `<div class="cards">${cards}</div>` : '<p>No reference pages yet. Add Markdown files under docs/ and run repo_agent again.</p>'}
${todos.length > 0 ? `<h2>Open items</h2><ul>${todos.map((todo) => `<li>${escapeHtml(todo)}</li>`).join('')}</ul>` : ''}`
  files.push({ path: join(docsDir, 'index.html'), content: page('总览', index, 'index') })
  files.push({ path: join(docsDir, 'style.css'), content: siteCss(style) })

  return { files, pages: pageList, todos, warnings }
}

export { MARKER as DOCS_MARKER }
