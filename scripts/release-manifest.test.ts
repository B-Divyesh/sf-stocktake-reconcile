import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const run = promisify(execFile)

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'stocktake-release-'))
  await mkdir(join(root, 'nested'), { recursive: true })
  await Promise.all([
    writeFile(join(root, 'nested', 'Stocktake arm.dmg'), 'mac'),
    writeFile(join(root, 'nested', 'Stocktake.msi'), 'windows'),
    writeFile(join(root, 'nested', 'Stocktake.AppImage'), 'linux')
  ])
  await run(process.execPath, ['scripts/release-manifest.mjs', root, 'v0.1.7', 'B-Divyesh/sf-stocktake-reconcile'], { cwd: process.cwd() })
  return { checksums: await readFile(join(root, 'SHA256SUMS'), 'utf8'), manifest: await readFile(join(root, 'latest.json'), 'utf8') }
}

describe('release manifest', () => {
  it('writes deterministic sorted checksums and platform URLs', async () => {
    const first = await fixture(), second = await fixture()
    expect(first).toEqual(second)
    expect(first.checksums.split('\n').filter(Boolean)).toEqual([...first.checksums.split('\n').filter(Boolean)].sort())
    expect(JSON.parse(first.manifest).platforms.linux.url).toContain('Stocktake.AppImage')
  })
})
