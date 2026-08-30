import { createHash } from 'node:crypto'
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const [directory, version, repository] = process.argv.slice(2)
if (!directory || !version || !repository) throw new Error('usage: release-manifest <asset-dir> <version> <owner/repo>')
// download-artifact preserves a directory for each matrix artifact. Flatten only
// release bundles so the checksum file and action-gh-release have one stable root.
const nested = (await readdir(directory, { recursive: true })).filter(file => /\.(dmg|msi|exe|AppImage|deb)$/i.test(file)).sort()
if (!nested.length) throw new Error('no desktop bundles found')
const releaseName = (file) => basename(file).replaceAll(' ', '.')
const files = nested.map(releaseName)
if (new Set(files).size !== files.length) throw new Error('bundle names collide after normalization')
for (let index = 0; index < nested.length; index += 1) await copyFile(join(directory, nested[index]), join(directory, files[index]))
const hashes = await Promise.all(files.map(async file => `${createHash('sha256').update(await readFile(join(directory, file))).digest('hex')}  ${file}`))
await writeFile(join(directory, 'SHA256SUMS'), `${hashes.sort().join('\n')}\n`)
const base = `https://github.com/${repository}/releases/download/${version}/`
const match = (expression) => files.find(file => expression.test(file))
const mac = match(/\.dmg$/i), windows = match(/\.msi$/i) || match(/\.exe$/i), linux = match(/\.AppImage$/i) || match(/\.deb$/i)
if (!mac || !windows || !linux) throw new Error(`missing platform asset (mac=${mac}, windows=${windows}, linux=${linux})`)
await writeFile(join(directory, 'latest.json'), `${JSON.stringify({ version, platforms: { macos: { url: base + encodeURIComponent(mac) }, windows: { url: base + encodeURIComponent(windows) }, linux: { url: base + encodeURIComponent(linux) } } }, null, 2)}\n`)
