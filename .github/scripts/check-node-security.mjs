#!/usr/bin/env node
//
// Fails when the Node.js major pinned in package.json "engines" needs
// attention:
//   - a security release for that major came out in the last WINDOW_DAYS
//     (Vercel only picks up a new 24.x patch on the next deploy), or
//   - that major reaches end of life within EOL_WARN_DAYS.
//
// Env:
//   WINDOW_DAYS    Optional, default 8 (the workflow runs weekly)
//   EOL_WARN_DAYS  Optional, default 90
import { readFileSync } from 'node:fs'

const WINDOW_DAYS = Number(process.env.WINDOW_DAYS ?? 8)
const EOL_WARN_DAYS = Number(process.env.EOL_WARN_DAYS ?? 90)
const DAY = 24 * 60 * 60 * 1000

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const major = /^(\d+)/.exec(pkg.engines?.node ?? '')?.[1]
if (!major) {
  console.log('::error::package.json has no engines.node major to check.')
  process.exit(1)
}

const [releases, schedule] = await Promise.all([
  fetch('https://nodejs.org/dist/index.json').then((r) => r.json()),
  fetch('https://raw.githubusercontent.com/nodejs/Release/main/schedule.json').then((r) => r.json()),
])

const problems = []
const now = Date.now()

const recentSecurity = releases.filter(
  (r) => r.version.startsWith(`v${major}.`) && r.security && now - Date.parse(r.date) <= WINDOW_DAYS * DAY,
)
for (const r of recentSecurity) {
  problems.push(
    `Node.js ${r.version} is a security release (${r.date}). Redeploy production on Vercel so it picks up the patched ${major}.x.`,
  )
}

const end = schedule[`v${major}`]?.end
if (end && Date.parse(end) - now <= EOL_WARN_DAYS * DAY) {
  problems.push(`Node.js ${major} reaches end of life on ${end}. Move engines.node to the next LTS major.`)
}

const latest = releases.find((r) => r.version.startsWith(`v${major}.`))
console.log(`Pinned major: ${major}.x, latest release: ${latest?.version ?? 'unknown'}`)

if (problems.length) {
  for (const p of problems) console.log(`::error::${p}`)
  process.exit(1)
}
console.log('No recent Node.js security releases or upcoming end of life.')
