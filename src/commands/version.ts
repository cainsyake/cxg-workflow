import { homedir } from 'node:os'
import fs from 'fs-extra'
import { join } from 'pathe'
import { checkForUpdates, getCurrentVersion } from '../utils/version'
import { readCxgConfig } from '../utils/config'
import { isWindows } from '../utils/platform'

export interface VersionOptions {
  check?: boolean
}

export async function showVersion(options: VersionOptions = {}): Promise<void> {
  const currentVersion = await getCurrentVersion()
  const config = await readCxgConfig()
  const localVersion = config?.general.version || '未安装'

  const wrapperPath = join(homedir(), '.codex', 'bin', isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper')
  let binaryVersion = '未安装'
  if (await fs.pathExists(wrapperPath)) {
    try {
      const { execSync } = await import('node:child_process')
      binaryVersion = execSync(`"${wrapperPath}" --version`, { stdio: 'pipe', encoding: 'utf-8' }).trim()
    }
    catch {
      binaryVersion = '已安装但不可执行'
    }
  }

  console.log()
  console.log('  CXG Version 状态')
  console.log()
  console.log(`  CLI package: v${currentVersion}`)
  console.log(`  Local workflow: ${localVersion === '未安装' ? localVersion : `v${localVersion}`}`)
  console.log(`  Binary: ${binaryVersion}`)
  if (config?.binary) {
    console.log(`  Binary source: ${config.binary.source || 'unknown'}`)
    console.log(`  Binary checksum: ${config.binary.checksum_status || 'unknown'}`)
  }

  if (options.check) {
    const { hasUpdate, latestVersion } = await checkForUpdates()
    if (latestVersion) {
      console.log(`  Latest npm: v${latestVersion}`)
      console.log(`  Update available: ${hasUpdate ? 'yes' : 'no'}`)
    }
    else {
      console.log('  Latest npm: unavailable')
    }
  }
  console.log()
}
