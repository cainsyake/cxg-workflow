import type { McpProvider } from '../types'
import ansis from 'ansis'
import { exec } from 'node:child_process'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import { homedir } from 'node:os'
import { dirname, join } from 'pathe'
import { promisify } from 'node:util'
import {
  checkForUpdates,
  compareVersions,
} from '../utils/version'
import {
  createDefaultConfig,
  readCxgConfig,
  writeCxgConfig,
} from '../utils/config'
import { DEFAULT_MCP_PROVIDER } from '../utils/constants'
import { showBinaryDownloadWarning, verifyBinary } from '../utils/binary'
import { installCxg } from '../utils/installer'
import { isWindows } from '../utils/platform'

const execAsync = promisify(exec)

export interface UpdateOptions {
  yes?: boolean
}

interface MoveRecord {
  from: string
  to: string
}

interface RestoreResult {
  restored: number
  total: number
  complete: boolean
}

async function moveIfExists(fromPath: string, toPath: string, records: MoveRecord[]): Promise<void> {
  if (!(await fs.pathExists(fromPath))) {
    return
  }
  await fs.ensureDir(dirname(toPath))
  await fs.move(fromPath, toPath, { overwrite: true })
  records.push({ from: fromPath, to: toPath })
}

async function restoreBackup(records: MoveRecord[]): Promise<RestoreResult> {
  let restored = 0
  let failed = 0

  for (const record of [...records].reverse()) {
    try {
      if (await fs.pathExists(record.from)) {
        await fs.remove(record.from)
      }
      if (await fs.pathExists(record.to)) {
        await fs.move(record.to, record.from, { overwrite: true })
        restored++
      }
    }
    catch {
      failed++
    }
  }

  return {
    restored,
    total: records.length,
    complete: failed === 0 && restored === records.length,
  }
}

async function backupLegacyPrompts(codexHome: string, backupRoot: string, records: MoveRecord[]): Promise<void> {
  const promptsDir = join(codexHome, 'prompts')
  if (!(await fs.pathExists(promptsDir))) {
    return
  }

  const files = await fs.readdir(promptsDir)
  for (const file of files) {
    if (!file.startsWith('cxg-') || !file.endsWith('.md')) {
      continue
    }
    await moveIfExists(
      join(promptsDir, file),
      join(backupRoot, 'prompts', file),
      records,
    )
  }
}

function getWrapperPath(codexHome: string): string {
  return join(codexHome, 'bin', isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper')
}

async function installLatestPackageViaNpx(liteMode: boolean, mcpProvider: McpProvider): Promise<void> {
  const liteFlag = liteMode ? '--lite' : '--no-lite'
  const mcpFlag = mcpProvider === 'skip' ? '--skip-mcp' : `--mcp ${mcpProvider}`

  await execAsync('npx --yes cxg-workflow@latest --version', { timeout: 60_000 })
  await execAsync(
    `npx --yes cxg-workflow@latest init --force ${liteFlag} ${mcpFlag}`,
    { timeout: 300_000 },
  )
}

async function performAtomicUpdate(
  fromVersion: string,
  toVersion: string,
  options: { installLatest: boolean },
): Promise<void> {
  const codexHome = join(homedir(), '.codex')
  const backupRoot = join(codexHome, '.cxg-update-bak')
  const records: MoveRecord[] = []
  const config = await readCxgConfig()

  const liteMode = config?.runtime?.lite_mode ?? true
  const mcpProvider = config?.mcp?.provider || DEFAULT_MCP_PROVIDER

  console.log()
  console.log(ansis.yellow.bold('  ⚙ 正在执行原子更新...'))
  console.log(ansis.gray(`    v${fromVersion} -> v${toVersion}`))
  console.log()

  try {
    await fs.remove(backupRoot).catch(() => {})
    await fs.ensureDir(backupRoot)

    await backupLegacyPrompts(codexHome, backupRoot, records)
    await moveIfExists(join(codexHome, 'skills', 'cxg'), join(backupRoot, 'skills', 'cxg'), records)
    await moveIfExists(join(codexHome, '.cxg'), join(backupRoot, '.cxg'), records)
    await moveIfExists(getWrapperPath(codexHome), join(backupRoot, 'bin', isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'), records)
  }
  catch (error) {
    await restoreBackup(records)
    throw new Error(`Backup failed: ${String(error)}`)
  }

  let installOk = false
  let installError: unknown
  try {
    if (options.installLatest) {
      await installLatestPackageViaNpx(liteMode, mcpProvider as McpProvider)
    }
    else {
      const installResult = await installCxg({
        force: true,
        liteMode,
        mcpProvider: mcpProvider as McpProvider,
      })

      if (!installResult.success) {
        throw new Error(installResult.errors.join(' | ') || 'Installation failed')
      }

      const nextConfig = createDefaultConfig({
        mcpProvider: mcpProvider as McpProvider,
        liteMode,
        binary: {
          source: installResult.binSource,
          checksum_status: installResult.binChecksumStatus,
          verified_at: new Date().toISOString(),
          version: installResult.binVersion,
        },
      })
      nextConfig.commands.installed = [...installResult.installedSkills].map(skill => `cxg-${skill}`)
      await writeCxgConfig(nextConfig)
    }

    const wrapperPath = getWrapperPath(codexHome)
    const binaryOk = await verifyBinary(wrapperPath)
    if (!binaryOk) {
      showBinaryDownloadWarning(join(codexHome, 'bin'))
      throw new Error('Binary verification failed after update')
    }

    installOk = true
  }
  catch (error) {
    installError = error
  }

  if (installOk) {
    await fs.remove(backupRoot).catch(() => {})
    console.log(ansis.green('  ✓ 更新完成，已清理备份'))
    return
  }

  console.log()
  console.log(ansis.yellow.bold('  ⚠ 更新失败，正在回滚旧版本...'))

  const restored = await restoreBackup(records)
  if (restored.complete) {
    await fs.remove(backupRoot).catch(() => {})
  }

  if (restored.complete) {
    console.log(ansis.green(`  ✓ 回滚完成，已恢复 ${restored.restored}/${restored.total} 项`))
  }
  else {
    console.log(ansis.red(`  ✗ 回滚不完整，仅恢复 ${restored.restored}/${restored.total} 项`))
    console.log(ansis.yellow(`  备份目录已保留，请手动检查: ${backupRoot}`))
  }

  throw (installError instanceof Error ? installError : new Error(String(installError)))
}

export async function update(options: UpdateOptions = {}): Promise<void> {
  console.log()
  console.log(ansis.cyan.bold('  🔄 检查 CXG 更新...'))
  console.log()

  const { hasUpdate, currentVersion, latestVersion } = await checkForUpdates()
  const localVersion = (await readCxgConfig())?.general.version || '0.0.0'
  const needsWorkflowUpdate = compareVersions(currentVersion, localVersion) > 0

  if (!latestVersion) {
    if (!needsWorkflowUpdate) {
      console.log(ansis.red('  ✗ 无法连接 npm registry，请稍后重试'))
      console.log()
      return
    }
    console.log(ansis.yellow('  ⚠ npm 不可达，将执行本地工作流修复更新'))
  }

  console.log(`  当前 CLI: v${currentVersion}`)
  console.log(`  最新版本: ${latestVersion ? `v${latestVersion}` : 'unavailable'}`)
  console.log(`  本地工作流: v${localVersion}`)
  console.log()

  const canUpdateToLatest = Boolean(latestVersion)
  const needUpdate = (canUpdateToLatest && hasUpdate) || needsWorkflowUpdate
  if (!needUpdate) {
    console.log(ansis.green('  ✓ 已是最新版本，无需更新'))
    console.log()
    return
  }

  let shouldUpdate = options.yes === true
  if (!shouldUpdate) {
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: '确认执行更新并启用失败自动回滚？',
      default: true,
    }])
    shouldUpdate = answer.confirmed
  }

  if (!shouldUpdate) {
    console.log(ansis.gray('  已取消更新'))
    console.log()
    return
  }

  try {
    const fromVersion = needsWorkflowUpdate ? localVersion : currentVersion
    const toVersion = (canUpdateToLatest && hasUpdate) ? latestVersion! : currentVersion
    await performAtomicUpdate(fromVersion, toVersion, {
      installLatest: canUpdateToLatest && hasUpdate,
    })
    console.log()
    console.log(ansis.green.bold(`  ✅ 更新成功: v${fromVersion} -> v${toVersion}`))
    console.log()
  }
  catch (error) {
    console.log(ansis.red(`  ✗ 更新失败: ${String(error)}`))
    console.log(ansis.gray('  建议执行: npx cxg-workflow init --force'))
    console.log()
  }
}
