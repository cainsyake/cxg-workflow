import { existsSync, readdirSync, readFileSync } from 'node:fs'
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

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath))
    }
    else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

const PACKAGE_ROOT = findPackageRoot()
const PROMPTS_DIR = join(PACKAGE_ROOT, 'templates', 'prompts')
const SKILLS_DIR = join(PACKAGE_ROOT, 'templates', 'skills')
const ROLES_DIR = join(PACKAGE_ROOT, 'templates', 'roles', 'codex')
const REQUIRED_SKILL_FILES = [
  join(SKILLS_DIR, 'SKILL.md'),
  join(SKILLS_DIR, 'run_skill.js'),
  join(SKILLS_DIR, 'orchestration', 'multi-agent', 'SKILL.md'),
  join(SKILLS_DIR, 'tools', 'gen-docs', 'SKILL.md'),
  join(SKILLS_DIR, 'tools', 'gen-docs', 'scripts', 'doc_generator.js'),
  join(SKILLS_DIR, 'tools', 'verify-change', 'SKILL.md'),
  join(SKILLS_DIR, 'tools', 'verify-change', 'scripts', 'change_analyzer.js'),
  join(SKILLS_DIR, 'tools', 'verify-module', 'SKILL.md'),
  join(SKILLS_DIR, 'tools', 'verify-module', 'scripts', 'module_scanner.js'),
  join(SKILLS_DIR, 'tools', 'verify-quality', 'SKILL.md'),
  join(SKILLS_DIR, 'tools', 'verify-quality', 'scripts', 'quality_checker.js'),
  join(SKILLS_DIR, 'tools', 'verify-security', 'SKILL.md'),
  join(SKILLS_DIR, 'tools', 'verify-security', 'scripts', 'security_scanner.js'),
]

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
        existsSync(templatePath),
        `prompt template missing: templates/prompts/${cmd}.md`,
      ).toBe(true)
    }
  })

  it('role prompts exist', () => {
    for (const role of ['analyzer', 'architect', 'reviewer']) {
      const rolePath = join(ROLES_DIR, `${role}.md`)
      expect(
        existsSync(rolePath),
        `role template missing: ${role}.md`,
      ).toBe(true)
    }
  })

  it('skills assets exist', () => {
    for (const requiredFile of REQUIRED_SKILL_FILES) {
      expect(
        existsSync(requiredFile),
        `required skill asset missing: ${requiredFile.replace(`${PACKAGE_ROOT}/`, '')}`,
      ).toBe(true)
    }

    const skillDefinitionFiles = collectMarkdownFiles(SKILLS_DIR)
      .filter(path => /[\\/]SKILL\.md$/.test(path))
      .filter(path => path !== join(SKILLS_DIR, 'SKILL.md'))

    expect(
      skillDefinitionFiles.length,
      'at least one nested skill definition should exist in templates/skills/',
    ).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────
// C. Template variable completeness
// ─────────────────────────────────────────────────────────────
describe('template variable completeness', () => {
  const allPrompts = collectMarkdownFiles(PROMPTS_DIR)
  const allSkills = collectMarkdownFiles(SKILLS_DIR)
  const allRoles = collectMarkdownFiles(ROLES_DIR)
  const allTemplates = [...allPrompts, ...allSkills, ...allRoles]

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

describe('skills template migration guards', () => {
  const legacyMarkers = [
    '~/.claude/skills/ccg',
    'npx ccg-workflow',
    'name: ccg-skills',
  ]
  const skillDocs = collectMarkdownFiles(SKILLS_DIR)

  for (const file of skillDocs) {
    const relativePath = file.replace(`${PACKAGE_ROOT}/`, '')
    it(`${relativePath}: no legacy CCG markers`, () => {
      const content = readFileSync(file, 'utf-8')
      for (const marker of legacyMarkers) {
        expect(content.includes(marker), `found legacy marker "${marker}" in ${relativePath}`).toBe(false)
      }
    })
  }
})
