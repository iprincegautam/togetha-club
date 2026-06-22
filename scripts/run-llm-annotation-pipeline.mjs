#!/usr/bin/env node
/**
 * Full LLM pipeline: auto-annotate winning responses, then judge all.
 *   node scripts/run-llm-annotation-pipeline.mjs [--limit 50]
 */
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function run(script, extraArgs = []) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('node', [resolve(root, 'scripts', script), ...extraArgs], {
      stdio: 'inherit',
      cwd: root,
    })
    child.on('close', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${script} exited with code ${code}`))
    })
  })
}

const extra = process.argv.slice(2)

console.log('Step 1/2: Auto-annotate winning responses...\n')
await run('auto-annotate-dms.mjs', extra)

console.log('\nStep 2/2: Judge losing vs winning responses...\n')
await run('judge-annotations.mjs')

console.log('\nPipeline complete.')
