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

export function getWorkflowConfigs() {
  return [...WORKFLOW_CONFIGS].sort((a, b) => a.order - b.order)
}

export function getAllCommandIds(): string[] {
  return [...ALL_COMMANDS]
}

/**
 * Install CXG workflow system to ~/.codex/
 *
 * Installs:
 * - Custom Prompts to ~/.codex/prompts/cxg-*.md
 * - Skills to ~/.codex/skills/cxg/* /SKILL.md
 * - Role prompts to ~/.codex/.cxg/roles/codex/*.md
 * - codeagent-wrapper binary to ~/.codex/bin/
 * - Config to ~/.codex/.cxg/config.toml
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

  // Ensure directories
  await fs.ensureDir(promptsDir)
  await fs.ensureDir(skillsDir)
  await fs.ensureDir(rolesDir)
  await fs.ensureDir(binDir)

  // 1. Install Custom Prompts
  const promptsTemplateDir = join(templateDir, 'prompts')
  if (await fs.pathExists(promptsTemplateDir)) {
    for (const cmd of ALL_COMMANDS) {
      const srcFile = join(promptsTemplateDir, `${cmd}.md`)
      const destFile = join(promptsDir, `${cmd}.md`)

      try {
        if (await fs.pathExists(srcFile)) {
          if (force || !(await fs.pathExists(destFile))) {
            let content = await fs.readFile(srcFile, 'utf-8')
            content = injectTemplateVariables(content, installConfig)
            content = replaceHomePathsInTemplate(content, codexHome)
            await fs.writeFile(destFile, content, 'utf-8')
            result.installedPrompts.push(cmd)
          }
        }
      }
      catch (error) {
        result.errors.push(`Failed to install prompt ${cmd}: ${error}`)
        result.success = false
      }
    }
  }

  // 2. Install Skills
  const skillsTemplateDir = join(templateDir, 'skills', 'cxg')
  if (await fs.pathExists(skillsTemplateDir)) {
    try {
      await fs.copy(skillsTemplateDir, skillsDir, {
        overwrite: force,
        errorOnExist: false,
      })

      // Post-copy: apply template variable replacement to .md files
      const replacePathsInDir = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            await replacePathsInDir(fullPath)
          }
          else if (entry.name.endsWith('.md')) {
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

      // Count installed skills
      const countSkills = async (dir: string): Promise<string[]> => {
        const skills: string[] = []
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillFile = join(dir, entry.name, 'SKILL.md')
            if (await fs.pathExists(skillFile)) {
              skills.push(entry.name)
            }
          }
        }
        return skills
      }
      result.installedSkills = await countSkills(skillsDir)
    }
    catch (error) {
      result.errors.push(`Failed to install skills: ${error}`)
      result.success = false
    }
  }

  // 3. Install Role Prompts
  const rolesTemplateDir = join(templateDir, 'roles', 'codex')
  if (await fs.pathExists(rolesTemplateDir)) {
    try {
      const files = await fs.readdir(rolesTemplateDir)
      for (const file of files) {
        if (file.endsWith('.md')) {
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
    }
    catch (error) {
      result.errors.push(`Failed to install roles: ${error}`)
      result.success = false
    }
  }

  // 4. Install codeagent-wrapper binary
  if (!skipBinary) {
    try {
      const binaryName = resolveBinaryName()
      const destBinary = join(binDir, isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper')

      const installed = await downloadBinary(binaryName, destBinary)
      if (installed) {
        const verified = await verifyBinary(destBinary)
        if (verified) {
          result.binInstalled = true
          result.binPath = binDir
        }
        else {
          result.errors.push('Binary verification failed')
          result.success = false
        }
      }
      else {
        result.errors.push(`Failed to download binary: ${binaryName}`)
        result.success = false
      }
    }
    catch (error) {
      result.errors.push(`Failed to install codeagent-wrapper: ${error}`)
      result.success = false
    }
  }

  return result
}

/**
 * Uninstall CXG workflow system from ~/.codex/
 */
export async function uninstallCxg(): Promise<UninstallResult> {
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

  // 2. Remove Skills (entire cxg/ directory)
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
  if (await fs.pathExists(binDir)) {
    try {
      const wrapperName = isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'
      const wrapperPath = join(binDir, wrapperName)
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
