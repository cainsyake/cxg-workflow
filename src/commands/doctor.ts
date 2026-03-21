import fs from 'fs-extra'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { version } from '../../package.json'
import { ALL_COMMANDS } from '../utils/constants'
import { readCxgConfig } from '../utils/config'
import { isWindows } from '../utils/platform'

interface DiagnosticResult {
  label: string
  ok: boolean
  detail?: string
}

export async function doctor(): Promise<void> {
  console.log()
  console.log(`  CXG Workflow Doctor v${version}`)
  console.log()

  const codexHome = join(homedir(), '.codex')
  const results: DiagnosticResult[] = []

  // 1. Check config
  const config = await readCxgConfig()
  results.push({
    label: '配置文件 (~/.codex/.cxg/config.toml)',
    ok: config !== null,
    detail: config ? `v${config.general.version}` : '未找到',
  })

  // 2. Check Custom Prompts
  const promptsDir = join(codexHome, 'prompts')
  let promptCount = 0
  const missingPrompts: string[] = []
  for (const cmd of ALL_COMMANDS) {
    const promptPath = join(promptsDir, `${cmd}.md`)
    if (await fs.pathExists(promptPath)) {
      promptCount++
    }
    else {
      missingPrompts.push(cmd)
    }
  }
  results.push({
    label: `Custom Prompts (${promptCount}/${ALL_COMMANDS.length})`,
    ok: promptCount === ALL_COMMANDS.length,
    detail: missingPrompts.length > 0 ? `缺失: ${missingPrompts.join(', ')}` : undefined,
  })

  // 3. Check skills
  const skillsDir = join(codexHome, 'skills', 'cxg')
  const requiredSkillFiles = [
    join(skillsDir, 'SKILL.md'),
    join(skillsDir, 'run_skill.js'),
    join(skillsDir, 'orchestration', 'multi-agent', 'SKILL.md'),
    join(skillsDir, 'tools', 'gen-docs', 'SKILL.md'),
    join(skillsDir, 'tools', 'gen-docs', 'scripts', 'doc_generator.js'),
    join(skillsDir, 'tools', 'verify-change', 'SKILL.md'),
    join(skillsDir, 'tools', 'verify-change', 'scripts', 'change_analyzer.js'),
    join(skillsDir, 'tools', 'verify-module', 'SKILL.md'),
    join(skillsDir, 'tools', 'verify-module', 'scripts', 'module_scanner.js'),
    join(skillsDir, 'tools', 'verify-quality', 'SKILL.md'),
    join(skillsDir, 'tools', 'verify-quality', 'scripts', 'quality_checker.js'),
    join(skillsDir, 'tools', 'verify-security', 'SKILL.md'),
    join(skillsDir, 'tools', 'verify-security', 'scripts', 'security_scanner.js'),
  ]
  const missingSkillFiles: string[] = []
  for (const file of requiredSkillFiles) {
    if (!(await fs.pathExists(file))) {
      missingSkillFiles.push(file.replace(`${codexHome}/`, ''))
    }
  }

  const countSkillDefinitions = async (dir: string): Promise<number> => {
    if (!(await fs.pathExists(dir))) {
      return 0
    }
    let count = 0
    const walk = async (current: string): Promise<void> => {
      if (current !== dir && await fs.pathExists(join(current, 'SKILL.md'))) {
        count++
      }
      const entries = await fs.readdir(current, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await walk(join(current, entry.name))
        }
      }
    }
    await walk(dir)
    return count
  }

  const skillDefinitions = await countSkillDefinitions(skillsDir)
  const skillsOk = missingSkillFiles.length === 0 && skillDefinitions > 0
  results.push({
    label: `Skills (${skillDefinitions} 个定义)`,
    ok: skillsOk,
    detail: missingSkillFiles.length > 0 ? `缺失: ${missingSkillFiles.join(', ')}` : undefined,
  })

  // 4. Check role prompts
  const rolesDir = join(codexHome, '.cxg', 'roles', 'codex')
  const roleNames = ['analyzer', 'architect', 'reviewer']
  const missingRoles: string[] = []
  for (const role of roleNames) {
    if (!(await fs.pathExists(join(rolesDir, `${role}.md`)))) {
      missingRoles.push(role)
    }
  }
  results.push({
    label: `角色提示词 (${roleNames.length - missingRoles.length}/${roleNames.length})`,
    ok: missingRoles.length === 0,
    detail: missingRoles.length > 0 ? `缺失: ${missingRoles.join(', ')}` : undefined,
  })

  // 5. Check binary
  const wrapperName = isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'
  const wrapperPath = join(codexHome, 'bin', wrapperName)
  const binExists = await fs.pathExists(wrapperPath)
  let binVersion = ''
  let binHealthy = false
  if (binExists) {
    try {
      const { execSync } = await import('node:child_process')
      binVersion = execSync(`"${wrapperPath}" --version`, { stdio: 'pipe', encoding: 'utf-8' }).trim()
      binHealthy = true
    }
    catch {
      binVersion = '(版本检测失败)'
    }
  }
  const source = config?.binary?.source ? `source=${config.binary.source}` : ''
  const checksum = config?.binary?.checksum_status ? `checksum=${config.binary.checksum_status}` : ''
  const details = [binVersion, source, checksum].filter(Boolean).join(' | ')
  results.push({
    label: 'codeagent-wrapper',
    ok: binExists && binHealthy,
    detail: binExists ? details : '未安装',
  })

  // 6. Check MCP config
  if (config?.mcp?.provider && config.mcp.provider !== 'skip') {
    const codexConfig = join(codexHome, 'config.toml')
    const codexConfigExists = await fs.pathExists(codexConfig)
    results.push({
      label: `MCP (${config.mcp.provider})`,
      ok: codexConfigExists,
      detail: codexConfigExists ? '已配置' : 'config.toml 未找到',
    })
  }

  // Print results
  let allOk = true
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗'
    const detail = r.detail ? ` — ${r.detail}` : ''
    console.log(`  ${icon} ${r.label}${detail}`)
    if (!r.ok) {
      allOk = false
    }
  }

  console.log()
  if (allOk) {
    console.log('  所有检查通过!')
  }
  else {
    console.log('  部分检查未通过，运行 npx cxg-workflow init --force 或 npx cxg-workflow update 修复')
  }
  console.log()
}
