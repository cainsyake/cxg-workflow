import type { InstallResult, McpProvider, UninstallResult } from '../types'
import fs from 'fs-extra'
import { homedir } from 'node:os'
import { dirname, join } from 'pathe'
import { fileURLToPath } from 'node:url'
import { ALL_COMMANDS, DEFAULT_MCP_PROVIDER, WORKFLOW_CONFIGS } from './constants'
import { downloadBinary, resolveBinaryName, verifyBinary } from './binary'
import { isWindows } from './platform'
import { injectTemplateVariables, replaceHomePathsInTemplate } from './template'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function findPackageRoot(startDir: string): string {
  let dir = startDir
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(join(dir, 'package.json'))) {
      return dir
    }
    dir = dirname(dir)
  }
  return startDir
}

const PACKAGE_ROOT = findPackageRoot(__dirname)

function getWrapperPath(binDir: string): string {
  return join(binDir, isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper')
}

async function readBinaryVersion(binaryPath: string): Promise<string | undefined> {
  try {
    const { execSync } = await import('node:child_process')
    return execSync(`"${binaryPath}" --version`, { stdio: 'pipe', encoding: 'utf-8' }).trim()
  }
  catch {
    return undefined
  }
}

async function countInstalledSkills(dir: string): Promise<string[]> {
  const skills: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const skillFile = join(dir, entry.name, 'SKILL.md')
    if (await fs.pathExists(skillFile)) {
      skills.push(entry.name)
    }
  }
  return skills
}

async function preflightCheck(templateDir: string, skipBinary: boolean): Promise<string[]> {
  const errors: string[] = []
  if (!(await fs.pathExists(templateDir))) {
    errors.push(`Template directory not found: ${templateDir}`)
  }

  const skillsTemplateDir = join(templateDir, 'skills', 'cxg')
  if (!(await fs.pathExists(skillsTemplateDir))) {
    errors.push(`Skills template directory not found: ${skillsTemplateDir}`)
  }

  const rolesTemplateDir = join(templateDir, 'roles', 'codex')
  if (!(await fs.pathExists(rolesTemplateDir))) {
    errors.push(`Roles template directory not found: ${rolesTemplateDir}`)
  }

  if (!skipBinary) {
    try {
      resolveBinaryName()
    }
    catch (error) {
      errors.push(`Unsupported platform for binary install: ${String(error)}`)
    }
  }

  return errors
}

async function postflightCheck(
  codexHome: string,
  skipBinary: boolean,
  result: InstallResult,
): Promise<string[]> {
  const errors: string[] = []
  const skillsDir = join(codexHome, 'skills', 'cxg')
  const missingSkills: string[] = []

  for (const cmd of ALL_COMMANDS) {
    const skillName = cmd.replace('cxg-', '')
    if (!(await fs.pathExists(join(skillsDir, skillName, 'SKILL.md')))) {
      missingSkills.push(skillName)
    }
  }

  if (missingSkills.length > 0) {
    errors.push(`Missing skill files after install: ${missingSkills.join(', ')}`)
  }

  if (!skipBinary && !result.binInstalled) {
    errors.push('Binary postflight check failed: codeagent-wrapper is unavailable')
  }

  return errors
}

export function getWorkflowConfigs() {
  return [...WORKFLOW_CONFIGS].sort((a, b) => a.order - b.order)
}

export function getAllCommandIds(): string[] {
  return [...ALL_COMMANDS]
}

async function cleanupLegacyPrompts(promptsDir: string): Promise<string[]> {
  const removed: string[] = []
  if (!(await fs.pathExists(promptsDir))) {
    return removed
  }

  const files = await fs.readdir(promptsDir)
  for (const file of files) {
    if (!file.startsWith('cxg-') || !file.endsWith('.md')) {
      continue
    }
    await fs.remove(join(promptsDir, file))
    removed.push(file.replace('.md', ''))
  }

  return removed
}

/**
 * Install CXG workflow system to ~/.codex/
 */
export async function installCxg(options: {
  force?: boolean
  liteMode?: boolean
  mcpProvider?: McpProvider
  skipBinary?: boolean
} = {}): Promise<InstallResult> {
  const { force = false, liteMode = true, mcpProvider = DEFAULT_MCP_PROVIDER, skipBinary = false } = options
  const codexHome = join(homedir(), '.codex')
  const promptsDir = join(codexHome, 'prompts')
  const skillsDir = join(codexHome, 'skills', 'cxg')
  const rolesDir = join(codexHome, '.cxg', 'roles', 'codex')
  const binDir = join(codexHome, 'bin')
  const templateDir = join(PACKAGE_ROOT, 'templates')
  const installConfig = { liteMode, mcpProvider }

  const result: InstallResult = {
    success: true,
    installedSkills: [],
    installedRoles: [],
    cleanedLegacyPrompts: [],
    errors: [],
  }

  const preflightErrors = await preflightCheck(templateDir, skipBinary)
  if (preflightErrors.length > 0) {
    result.success = false
    result.errors.push(...preflightErrors)
    return result
  }

  await fs.ensureDir(skillsDir)
  await fs.ensureDir(rolesDir)
  await fs.ensureDir(binDir)

  // 1. Cleanup legacy prompts from old dual-track releases
  try {
    result.cleanedLegacyPrompts = await cleanupLegacyPrompts(promptsDir)
  }
  catch (error) {
    result.errors.push(`Failed to cleanup legacy prompts: ${error}`)
    result.success = false
  }

  // 2. Install Skills
  const skillsTemplateDir = join(templateDir, 'skills', 'cxg')
  try {
    await fs.copy(skillsTemplateDir, skillsDir, {
      overwrite: force,
      errorOnExist: false,
    })

    const replacePathsInDir = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          await replacePathsInDir(fullPath)
          continue
        }
        if (entry.name.endsWith('.md')) {
          const original = await fs.readFile(fullPath, 'utf-8')
          let processed = injectTemplateVariables(original, installConfig)
          processed = replaceHomePathsInTemplate(processed, codexHome)
          if (processed !== original) {
            await fs.writeFile(fullPath, processed, 'utf-8')
          }
        }
      }
    }

    await replacePathsInDir(skillsDir)
    result.installedSkills = await countInstalledSkills(skillsDir)
  }
  catch (error) {
    result.errors.push(`Failed to install skills: ${error}`)
    result.success = false
  }

  // 3. Install Role Prompts
  const rolesTemplateDir = join(templateDir, 'roles', 'codex')
  try {
    const files = await fs.readdir(rolesTemplateDir)
    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue
      }
      const srcFile = join(rolesTemplateDir, file)
      const destFile = join(rolesDir, file)
      if (force || !(await fs.pathExists(destFile))) {
        const content = await fs.readFile(srcFile, 'utf-8')
        const processed = replaceHomePathsInTemplate(content, codexHome)
        await fs.writeFile(destFile, processed, 'utf-8')
        result.installedRoles.push(file.replace('.md', ''))
      }
    }
  }
  catch (error) {
    result.errors.push(`Failed to install roles: ${error}`)
    result.success = false
  }

  // 4. Install codeagent-wrapper binary
  if (!skipBinary) {
    const binaryName = resolveBinaryName()
    const destBinary = getWrapperPath(binDir)

    try {
      if (await fs.pathExists(destBinary)) {
        const isHealthy = await verifyBinary(destBinary)
        if (isHealthy) {
          result.binInstalled = true
          result.binPath = binDir
          result.binSource = 'local-existing'
          result.binChecksumStatus = 'skipped'
          result.binVersion = await readBinaryVersion(destBinary)
        }
      }

      if (!result.binInstalled) {
        const downloadResult = await downloadBinary(binaryName, destBinary)
        if (!downloadResult.success) {
          result.errors.push(`Failed to download binary: ${binaryName} (${downloadResult.error || 'unknown error'})`)
          result.success = false
        }
        else {
          const verified = await verifyBinary(destBinary)
          if (!verified) {
            result.errors.push('Binary verification failed after download')
            result.success = false
          }
          else {
            result.binInstalled = true
            result.binPath = binDir
            result.binSource = downloadResult.sourceName
            result.binChecksumStatus = downloadResult.checksumStatus
            result.binVersion = await readBinaryVersion(destBinary)
          }
        }
      }
    }
    catch (error) {
      result.errors.push(`Failed to install codeagent-wrapper: ${error}`)
      result.success = false
    }
  }

  const postflightErrors = await postflightCheck(codexHome, skipBinary, result)
  if (postflightErrors.length > 0) {
    result.errors.push(...postflightErrors)
    result.success = false
  }

  return result
}

/**
 * Uninstall CXG workflow system from ~/.codex/
 */
export async function uninstallCxg(options?: { preserveBinary?: boolean }): Promise<UninstallResult> {
  const codexHome = join(homedir(), '.codex')
  const promptsDir = join(codexHome, 'prompts')
  const skillsDir = join(codexHome, 'skills', 'cxg')
  const rolesDir = join(codexHome, '.cxg', 'roles')
  const cxgDir = join(codexHome, '.cxg')
  const binDir = join(codexHome, 'bin')

  const result: UninstallResult = {
    success: true,
    removedSkills: [],
    removedRoles: [],
    removedLegacyPrompts: [],
    removedBin: false,
    errors: [],
  }

  // 1. Remove Skills (entire cxg/ directory)
  if (await fs.pathExists(skillsDir)) {
    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          result.removedSkills.push(entry.name)
        }
      }
      await fs.remove(skillsDir)
    }
    catch (error) {
      result.errors.push(`Failed to remove skills: ${error}`)
      result.success = false
    }
  }

  // 2. Remove Roles and .cxg directory
  if (await fs.pathExists(cxgDir)) {
    try {
      if (await fs.pathExists(rolesDir)) {
        const files = await fs.readdir(join(rolesDir, 'codex')).catch(() => [])
        for (const file of files) {
          if (typeof file === 'string') {
            result.removedRoles.push(file.replace('.md', ''))
          }
        }
      }
      await fs.remove(cxgDir)
    }
    catch (error) {
      result.errors.push(`Failed to remove .cxg directory: ${error}`)
      result.success = false
    }
  }

  // 3. Remove codeagent-wrapper binary
  if (!options?.preserveBinary && await fs.pathExists(binDir)) {
    try {
      const wrapperPath = getWrapperPath(binDir)
      if (await fs.pathExists(wrapperPath)) {
        await fs.remove(wrapperPath)
        result.removedBin = true
      }
    }
    catch (error) {
      result.errors.push(`Failed to remove binary: ${error}`)
      result.success = false
    }
  }

  // 4. Remove legacy prompts from old dual-track releases
  try {
    result.removedLegacyPrompts = await cleanupLegacyPrompts(promptsDir)
  }
  catch (error) {
    result.errors.push(`Failed to remove legacy prompts: ${error}`)
    result.success = false
  }

  return result
}
