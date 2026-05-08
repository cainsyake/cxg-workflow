import type { CxgConfig } from '../types'
import fs from 'fs-extra'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { version } from '../../package.json'
import { AGENT_TEMPLATES } from '../utils/constants'
import { readCxgConfig } from '../utils/config'
import { getManagedPostflightPaths } from '../utils/installer'
import { isWindows } from '../utils/platform'

interface DiagnosticResult {
  label: string
  ok: boolean
  detail?: string
  severity?: 'error' | 'warning' | 'info'
}

interface DoctorDiagnostics {
  ok: boolean
  results: DiagnosticResult[]
}

interface DoctorDependencies {
  codexHome?: string
  exists?: (path: string) => Promise<boolean>
  readDir?: (path: string) => Promise<string[]>
  readConfig?: () => Promise<CxgConfig | null>
  getBinaryStatus?: (wrapperPath: string) => Promise<{
    exists: boolean
    healthy: boolean
    version?: string
  }>
}

const ROLE_NAMES = [
  'analyzer',
  'analyzer-frontend',
  'architect',
  'architect-frontend',
  'debugger',
  'debugger-frontend',
  'frontend',
  'optimizer',
  'optimizer-frontend',
  'reviewer',
  'reviewer-frontend',
  'tester',
  'tester-frontend',
] as const

async function countSkillDefinitions(
  skillsDir: string,
  exists: (path: string) => Promise<boolean>,
  readDir: (path: string) => Promise<string[]>,
): Promise<number> {
  if (!(await exists(skillsDir))) {
    return 0
  }

  let count = 0

  const walk = async (current: string): Promise<void> => {
    if (current !== skillsDir && await exists(join(current, 'SKILL.md'))) {
      count++
    }

    const entries = await readDir(current)
    for (const entry of entries) {
      await walk(join(current, entry))
    }
  }

  await walk(skillsDir)
  return count
}

async function getLegacyPromptDiagnostics(
  promptsDir: string,
  readDir: (path: string) => Promise<string[]>,
): Promise<DiagnosticResult | null> {
  try {
    const entries = await readDir(promptsDir)
    const legacyPrompts = entries
      .filter(entry => entry.startsWith('cxg-') && entry.endsWith('.md'))
      .map(entry => entry.replace('.md', ''))
      .sort()

    if (legacyPrompts.length === 0) {
      return null
    }

    return {
      label: '遗留 Prompt 文件',
      ok: true,
      severity: 'warning',
      detail: `检测到 ${legacyPrompts.join(', ')}；仅供手动清理参考，不影响当前 skills 工作流`,
    }
  }
  catch {
    return null
  }
}

async function getBinaryStatus(wrapperPath: string): Promise<{
  exists: boolean
  healthy: boolean
  version?: string
}> {
  const exists = await fs.pathExists(wrapperPath)
  if (!exists) {
    return { exists: false, healthy: false }
  }

  try {
    const { execSync } = await import('node:child_process')
    const binaryVersion = execSync(`"${wrapperPath}" --version`, { stdio: 'pipe', encoding: 'utf-8' }).trim()
    return {
      exists: true,
      healthy: true,
      version: binaryVersion,
    }
  }
  catch {
    return {
      exists: true,
      healthy: false,
    }
  }
}

export async function buildDoctorDiagnostics(deps: DoctorDependencies = {}): Promise<DoctorDiagnostics> {
  const codexHome = deps.codexHome || join(homedir(), '.codex')
  const exists = deps.exists || fs.pathExists
  const readDir = deps.readDir || (async path => {
    const entries = await fs.readdir(path, { withFileTypes: true })
    return entries.filter(entry => entry.isDirectory() || entry.isFile()).map(entry => entry.name)
  })
  const readConfig = deps.readConfig || readCxgConfig
  const inspectBinary = deps.getBinaryStatus || getBinaryStatus

  const results: DiagnosticResult[] = []
  const config = await readConfig()

  results.push({
    label: '配置文件 (~/.codex/.cxg/config.toml)',
    ok: config !== null,
    detail: config ? `v${config.general.version}` : '未找到',
  })

  const skillsDir = join(codexHome, 'skills', 'cxg')
  const { skillAssets } = getManagedPostflightPaths(codexHome)
  const missingSkillFiles: string[] = []

  for (const file of skillAssets) {
    if (!(await exists(file))) {
      missingSkillFiles.push(file.replace(`${codexHome}/`, ''))
    }
  }

  const skillDefinitions = await countSkillDefinitions(skillsDir, exists, readDir)
  results.push({
    label: `Skills (${skillDefinitions} 个定义)`,
    ok: missingSkillFiles.length === 0,
    detail: missingSkillFiles.length > 0 ? `缺失: ${missingSkillFiles.join(', ')}` : undefined,
  })

  const rolesDir = join(codexHome, '.cxg', 'roles', 'codex')
  const missingRoles: string[] = []
  for (const role of ROLE_NAMES) {
    if (!(await exists(join(rolesDir, `${role}.md`)))) {
      missingRoles.push(role)
    }
  }
  results.push({
    label: `角色提示词 (${ROLE_NAMES.length - missingRoles.length}/${ROLE_NAMES.length})`,
    ok: missingRoles.length === 0,
    detail: missingRoles.length > 0 ? `缺失: ${missingRoles.join(', ')}` : undefined,
  })

  const agentsDir = join(codexHome, '.cxg', 'agents', 'codex')
  const missingAgents: string[] = []
  for (const agent of AGENT_TEMPLATES) {
    if (!(await exists(join(agentsDir, `${agent}.md`)))) {
      missingAgents.push(agent)
    }
  }
  results.push({
    label: `子 Agent 模板 (${AGENT_TEMPLATES.length - missingAgents.length}/${AGENT_TEMPLATES.length})`,
    ok: missingAgents.length === 0,
    detail: missingAgents.length > 0 ? `缺失: ${missingAgents.join(', ')}` : undefined,
  })

  const wrapperName = isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'
  const wrapperPath = join(codexHome, 'bin', wrapperName)
  const binaryStatus = await inspectBinary(wrapperPath)
  const source = config?.binary?.source ? `source=${config.binary.source}` : ''
  const checksum = config?.binary?.checksum_status ? `checksum=${config.binary.checksum_status}` : ''
  const details = [binaryStatus.version || (!binaryStatus.healthy && binaryStatus.exists ? '(版本检测失败)' : ''), source, checksum]
    .filter(Boolean)
    .join(' | ')

  results.push({
    label: 'codeagent-wrapper',
    ok: binaryStatus.exists && binaryStatus.healthy,
    detail: binaryStatus.exists ? details : '未安装',
  })

  if (config?.mcp?.provider && config.mcp.provider !== 'skip') {
    const codexConfig = join(codexHome, 'config.toml')
    const codexConfigExists = await exists(codexConfig)
    results.push({
      label: `MCP (${config.mcp.provider})`,
      ok: codexConfigExists,
      detail: codexConfigExists ? '已配置' : 'config.toml 未找到',
    })
  }

  const legacyPrompts = await getLegacyPromptDiagnostics(join(codexHome, 'prompts'), readDir)
  if (legacyPrompts) {
    results.push(legacyPrompts)
  }

  return {
    ok: results.every(result => result.ok),
    results,
  }
}

export async function doctor(): Promise<void> {
  console.log()
  console.log(`  CXG Workflow Doctor v${version}`)
  console.log()

  const diagnostics = await buildDoctorDiagnostics()

  for (const result of diagnostics.results) {
    const icon = result.ok ? (result.severity === 'warning' ? '⚠' : '✓') : '✗'
    const detail = result.detail ? ` — ${result.detail}` : ''
    console.log(`  ${icon} ${result.label}${detail}`)
  }

  console.log()
  if (diagnostics.ok) {
    console.log('  所有必需检查通过!')
  }
  else {
    console.log('  部分检查未通过，运行 npx cxg-workflow init --force 或 npx cxg-workflow update 修复')
  }
  console.log()
}
