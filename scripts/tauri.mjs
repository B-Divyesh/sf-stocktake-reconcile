import { spawn } from 'node:child_process'
import { join } from 'node:path'

const environment = { ...process.env }
if (process.platform === 'linux') {
  environment.APPIMAGE_EXTRACT_AND_RUN ??= '1'
  environment.PATH = `${join(process.cwd(), 'scripts/linux-tools')}:${environment.PATH}`
}
const command = process.platform === 'win32' ? 'tauri.cmd' : 'tauri'
const child = spawn(command, process.argv.slice(2), { stdio: 'inherit', env: environment, shell: process.platform === 'win32' })
child.on('exit', code => process.exit(code ?? 1))
