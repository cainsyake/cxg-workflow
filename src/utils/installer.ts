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

async function replacePathsInMarkdownFiles(
  dir: string,
  codexHome: string,
  installConfig: { liteMode: boolean, mcpProvider: McpProvider },
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await replacePathsInMarkdownFiles(fullPath, codexHome, installConfig)
      continue
    }
    if (!entry.name.endsWith('.md')) {
      continue
    }
    const original = await fs.readFile(fullPath, 'utf-8')
    let processed = injectTemplateVariables(original, installConfig)
    processed = replaceHomePathsInTemplate(processed, codexHome)
    if (processed !== original) {
      await fs.writeFile(fullPath, processed, 'utf-8')
    }
  }
}

async function collectInstalledSkills(skillsDir: string): Promise<string[]> {
  const skillIds: string[] = []
  if (!(await fs.pathExists(skillsDir))) {
    return skillIds
  }

  const walk = async (dir: string): Promise<void> => {
    if (dir !== skillsDir && await fs.pathExists(join(dir, 'SKILL.md'))) {
      const relative = dir.slice(skillsDir.length + 1).replace(/\\/g, '/')
      skillIds.push(relative)
    }
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(join(dir, entry.name))
      }
    }
  }

  await walk(skillsDir)
  return skillIds.sort()
}

async function preflightCheck(templateDir: string, skipBinary: boolean): Promise<string[]> {
  const errors: string[] = []
  if (!(await fs.pathExists(templateDir))) {
    errors.push(`Template directory not found: ${templateDir}`)
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
  const promptsDir = join(codexHome, 'prompts')
  const missingPrompts: string[] = []

  for (const cmd of ALL_COMMANDS) {
    if (!(await fs.pathExists(join(promptsDir, `${cmd}.md`)))) {
      missingPrompts.push(cmd)
    }
  }

  if (missingPrompts.length > 0) {
    errors.push(`Missing prompt files after install: ${missingPrompts.join(', ')}`)
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
    installedPrompts: [],
    installedSkills: [],
    installedRoles: [],
    errors: [],
  }

  const preflightErrors = await preflightCheck(templateDir, skipBinary)
  if (preflightErrors.length > 0) {
    result.success = false
    result.errors.push(...preflightErrors)
    return result
  }

  await fs.ensureDir(promptsDir)
  await fs.ensureDir(skillsDir)
  await fs.ensureDir(rolesDir)
  await fs.ensureDir(binDir)

  // 1. Install Custom Prompts
  const promptsTemplateDir = join(templateDir, 'prompts')
  for (const cmd of ALL_COMMANDS) {
    const srcFile = join(promptsTemplateDir, `${cmd}.md`)
    const destFile = join(promptsDir, `${cmd}.md`)

    try {
      if (!(await fs.pathExists(srcFile))) {
        result.errors.push(`Prompt template not found: ${cmd}`)
        result.success = false
        continue
      }
      if (force || !(await fs.pathExists(destFile))) {
        let content = await fs.readFile(srcFile, 'utf-8')
        content = injectTemplateVariables(content, installConfig)
        content = replaceHomePathsInTemplate(content, codexHome)
        await fs.writeFile(destFile, content, 'utf-8')
        result.installedPrompts.push(cmd)
      }
    }
    catch (error) {
      result.errors.push(`Failed to install prompt ${cmd}: ${error}`)
      result.success = false
    }
  }

  // 2. Install skills
  const skillsTemplateDir = join(templateDir, 'skills')
  if (await fs.pathExists(skillsTemplateDir)) {
    try {
      if (force && await fs.pathExists(skillsDir)) {
        await fs.remove(skillsDir)
        await fs.ensureDir(skillsDir)
      }
      await fs.copy(skillsTemplateDir, skillsDir, {
        overwrite: force,
        errorOnExist: false,
      })
      await replacePathsInMarkdownFiles(skillsDir, codexHome, installConfig)
      result.installedSkills = await collectInstalledSkills(skillsDir)
    }
    catch (error) {
      result.errors.push(`Failed to install skills: ${error}`)
      result.success = false
    }
  }
  else {
    result.errors.push(`Skills template directory not found: ${skillsTemplateDir}`)
    result.success = false
  }

  // 3. Install role prompts
  const rolesTemplateDir = join(templateDir, 'roles', 'codex')
  if (await fs.pathExists(rolesTemplateDir)) {
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
  }
  else {
    result.errors.push(`Roles template directory not found: ${rolesTemplateDir}`)
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
    removedPrompts: [],
    removedSkills: [],
    removedRoles: [],
    removedBin: false,
    errors: [],
  }

  // 1. Remove Custom Prompts (only cxg-* files)
  if (await fs.pathExists(promptsDir)) {
    try {
      const files = await fs.readdir(promptsDir)
      for (const file of files) {
        if (file.startsWith('cxg-') && file.endsWith('.md')) {
          await fs.remove(join(promptsDir, file))
          result.removedPrompts.push(file.replace('.md', ''))
        }
      }
    }
    catch (error) {
      result.errors.push(`Failed to remove prompts: ${error}`)
      result.success = false
    }
  }

  // 2. Remove skills directory (if exists)
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

  // 3. Remove Roles and .cxg directory
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

  // 4. Remove codeagent-wrapper binary
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

  return result
}
