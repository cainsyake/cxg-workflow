import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALL_COMMANDS, WORKFLOW_CONFIGS } from '../constants'
import { getAllCommandIds, getWorkflowConfigs } from '../installer'
import { injectTemplateVariables } from '../template'

// Helper: find package root
function findPackageRoot(): string {
  let dir = import.meta.dirname
  for (let i = 0; i < 10; i++) {
    try {
      readFileSync(join(dir, 'package.json'))
      return dir
    }
    catch {
      dir = join(dir, '..')
    }
  }
  throw new Error('Could not find package root')
}

const PACKAGE_ROOT = findPackageRoot()
const PROMPTS_DIR = join(PACKAGE_ROOT, 'templates', 'prompts')
const SKILLS_DIR = join(PACKAGE_ROOT, 'templates', 'skills', 'cxg')

// ─────────────────────────────────────────────────────────────
// A. Command registry consistency
// ─────────────────────────────────────────────────────────────
describe('command registry', () => {
  it('ALL_COMMANDS contains 12 commands', () => {
    expect(ALL_COMMANDS.length).toBe(12)
  })

  it('all commands start with cxg- prefix', () => {
    for (const cmd of ALL_COMMANDS) {
      expect(cmd.startsWith('cxg-'), `${cmd} should start with cxg-`).toBe(true)
    }
  })

  it('getAllCommandIds returns all commands', () => {
    const ids = getAllCommandIds()
    expect(ids).toEqual([...ALL_COMMANDS])
  })

  it('all command IDs are unique', () => {
    const ids = getAllCommandIds()
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('getWorkflowConfigs returns sorted by order', () => {
    const configs = getWorkflowConfigs()
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i].order).toBeGreaterThanOrEqual(configs[i - 1].order)
    }
  })

  it('all workflows have both name and nameEn', () => {
    const configs = getWorkflowConfigs()
    for (const config of configs) {
      expect(config.name, `${config.id} missing name`).toBeTruthy()
      expect(config.nameEn, `${config.id} missing nameEn`).toBeTruthy()
    }
  })

  it('WORKFLOW_CONFIGS count matches ALL_COMMANDS', () => {
    expect(WORKFLOW_CONFIGS.length).toBe(ALL_COMMANDS.length)
  })
})

// ─────────────────────────────────────────────────────────────
// B. Template file completeness
// ─────────────────────────────────────────────────────────────
describe('template file completeness', () => {
  it('every command has a matching Custom Prompt template', () => {
    for (const cmd of ALL_COMMANDS) {
      const templatePath = join(PROMPTS_DIR, `${cmd}.md`)
      expect(
        require('fs').existsSync(templatePath),
        `prompt template missing: templates/prompts/${cmd}.md`,
      ).toBe(true)
    }
  })

  it('every command has a matching Skill template', () => {
    for (const cmd of ALL_COMMANDS) {
      const shortName = cmd.replace('cxg-', '')
      const skillPath = join(SKILLS_DIR, shortName, 'SKILL.md')
      expect(
        require('fs').existsSync(skillPath),
        `skill template missing: templates/skills/cxg/${shortName}/SKILL.md`,
      ).toBe(true)
    }
  })

  it('role prompts exist', () => {
    const rolesDir = join(PACKAGE_ROOT, 'templates', 'roles', 'codex')
    for (const role of ['analyzer', 'architect', 'reviewer']) {
      const rolePath = join(rolesDir, `${role}.md`)
      expect(
        require('fs').existsSync(rolePath),
        `role template missing: ${role}.md`,
      ).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────
// C. Template variable completeness
// ─────────────────────────────────────────────────────────────
describe('template variable completeness', () => {
  function collectTemplateFiles(dir: string): string[] {
    const files: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...collectTemplateFiles(fullPath))
      }
      else if (entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
    return files
  }

  const allPrompts = collectTemplateFiles(PROMPTS_DIR)
  const allSkills = collectTemplateFiles(SKILLS_DIR)
  const allTemplates = [...allPrompts, ...allSkills]

  it('finds template files', () => {
    expect(allTemplates.length).toBeGreaterThan(0)
  })

  for (const file of allTemplates) {
    const relativePath = file.replace(PACKAGE_ROOT + '/', '')

    it(`${relativePath}: no unprocessed {{variables}} after injection`, () => {
      const content = readFileSync(file, 'utf-8')
      const result = injectTemplateVariables(content, {
        liteMode: false,
        mcpProvider: 'ace-tool',
      })

      // Find any remaining {{ }} template variables
      const remaining = result.match(/\{\{[A-Z_]+\}\}/g) || []
      // Filter out known runtime variables (replaced at install time by replaceHomePathsInTemplate)
      const unprocessed = remaining.filter(v =>
        !v.includes('WORKDIR')
        && !v.includes('WRAPPER_BIN')
        && !v.includes('ROLE_ANALYZER')
        && !v.includes('ROLE_ARCHITECT')
        && !v.includes('ROLE_REVIEWER'),
      )
      expect(unprocessed, `unprocessed variables in ${relativePath}: ${unprocessed.join(', ')}`).toEqual([])
    })
  }
})

// ─────────────────────────────────────────────────────────────
// D. Skill frontmatter validation
// ─────────────────────────────────────────────────────────────
describe('skill SKILL.md frontmatter', () => {
  for (const cmd of ALL_COMMANDS) {
    const shortName = cmd.replace('cxg-', '')
    it(`${shortName}/SKILL.md has valid frontmatter`, () => {
      const skillPath = join(SKILLS_DIR, shortName, 'SKILL.md')
      const content = readFileSync(skillPath, 'utf-8')

      // Must start with ---
      expect(content.startsWith('---'), 'must start with YAML frontmatter').toBe(true)

      // Must have name field matching cxg-<shortName>
      expect(content).toContain(`name: ${cmd}`)

      // Must have description field
      expect(content).toMatch(/description:\s*"/)
    })
  }
})
