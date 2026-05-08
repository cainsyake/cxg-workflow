import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALL_COMMANDS, WORKFLOW_CONFIGS } from '../constants'
import { getAllCommandIds, getManagedPostflightPaths, getWorkflowConfigs } from '../installer'
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
const PACKAGE_JSON_PATH = join(PACKAGE_ROOT, 'package.json')
const README_EN_PATH = join(PACKAGE_ROOT, 'README.md')
const README_ZH_PATH = join(PACKAGE_ROOT, 'README.zh-CN.md')
const PROMPTS_DIR = join(PACKAGE_ROOT, 'templates', 'prompts')
const SKILLS_DIR = join(PACKAGE_ROOT, 'templates', 'skills')
const ROLES_DIR = join(PACKAGE_ROOT, 'templates', 'roles', 'codex')
const AGENTS_DIR = join(PACKAGE_ROOT, 'templates', 'commands', 'agents')
const PACKAGE_JSON = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8')) as { files?: string[] }
const README_PATHS = [README_EN_PATH, README_ZH_PATH]
const SKILLS_NATIVE_COMMANDS = [
  'cxg-workflow',
  'cxg-plan',
  'cxg-execute',
  'cxg-feat',
  'cxg-analyze',
  'cxg-debug',
  'cxg-optimize',
  'cxg-test',
  'cxg-review',
  'cxg-enhance',
  'cxg-commit',
  'cxg-init',
]
const TARGET_ROLE_FILES = [
  'analyzer.md',
  'analyzer-frontend.md',
  'architect.md',
  'architect-frontend.md',
  'debugger.md',
  'debugger-frontend.md',
  'frontend.md',
  'optimizer.md',
  'optimizer-frontend.md',
  'reviewer.md',
  'reviewer-frontend.md',
  'tester.md',
  'tester-frontend.md',
]
const REQUIRED_SKILL_FILES = [
  join(SKILLS_DIR, 'SKILL.md'),
  join(SKILLS_DIR, 'run_skill.js'),
  join(SKILLS_DIR, 'shared', 'workflow-rules.md'),
  join(SKILLS_DIR, 'shared', 'interaction-checkpoints.md'),
  join(SKILLS_DIR, 'shared', 'output-contracts.md'),
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
const REQUIRED_AGENT_FILES = [
  join(AGENTS_DIR, 'get-current-datetime.md'),
  join(AGENTS_DIR, 'init-architect.md'),
  join(AGENTS_DIR, 'planner.md'),
  join(AGENTS_DIR, 'ui-ux-designer.md'),
]
const REQUIRED_WORKFLOW_SKILL_SECTIONS = [
  '## Purpose',
  '## Expected Input',
  '## Workflow',
  '## Deliverable',
]
const REQUIRED_WORKFLOW_SHARED_REFERENCES = [
  '../shared/workflow-rules.md',
  '../shared/interaction-checkpoints.md',
  '../shared/output-contracts.md',
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
  it('package publish list excludes templates/prompts', () => {
    expect(PACKAGE_JSON.files).toBeTruthy()
    expect(PACKAGE_JSON.files).not.toContain('templates/prompts/')
  })

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
    for (const role of ['analyzer', 'analyzer-frontend', 'architect', 'architect-frontend', 'debugger', 'debugger-frontend', 'frontend', 'optimizer', 'optimizer-frontend', 'reviewer', 'reviewer-frontend', 'tester', 'tester-frontend']) {
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

    for (const commandId of ALL_COMMANDS) {
      const skillEntryPath = join(SKILLS_DIR, commandId, 'SKILL.md')
      expect(
        existsSync(skillEntryPath),
        `workflow skill entry missing: templates/skills/${commandId}/SKILL.md`,
      ).toBe(true)
    }

    const skillDefinitionFiles = collectMarkdownFiles(SKILLS_DIR)
      .filter(path => /[\\/]SKILL\.md$/.test(path))
      .filter(path => path !== join(SKILLS_DIR, 'SKILL.md'))

    expect(
      skillDefinitionFiles.length,
      'expected workflow skill entrypoints plus nested supporting skills in templates/skills/',
    ).toBeGreaterThanOrEqual(ALL_COMMANDS.length + 6)
  })

  it('workflow skill entrypoints include the shared content contract', () => {
    for (const commandId of ALL_COMMANDS) {
      const skillEntryPath = join(SKILLS_DIR, commandId, 'SKILL.md')
      const content = readFileSync(skillEntryPath, 'utf-8')

      for (const section of REQUIRED_WORKFLOW_SKILL_SECTIONS) {
        expect(
          content.includes(section),
          `${commandId} missing required section: ${section}`,
        ).toBe(true)
      }

      for (const sharedReference of REQUIRED_WORKFLOW_SHARED_REFERENCES) {
        expect(
          content.includes(sharedReference),
          `${commandId} missing shared guidance reference: ${sharedReference}`,
        ).toBe(true)
      }
    }
  })

  it('top-level shipped skill docs advertise $cxg-* entrypoints instead of slash commands', () => {
    for (const commandId of ALL_COMMANDS) {
      const skillEntryPath = join(SKILLS_DIR, commandId, 'SKILL.md')
      const content = readFileSync(skillEntryPath, 'utf-8')

      expect(
        content.includes(`# $${commandId}`),
        `${commandId} should advertise the $${commandId} entrypoint`,
      ).toBe(true)
      expect(
        content.includes(`$${commandId}`),
        `${commandId} should mention the $${commandId} entrypoint`,
      ).toBe(true)
      expect(
        content.includes(`/${commandId}`),
        `${commandId} should not advertise slash-command entrypoints`,
      ).toBe(false)
    }
  })

  it('agent templates exist', () => {
    for (const requiredFile of REQUIRED_AGENT_FILES) {
      expect(
        existsSync(requiredFile),
        `required agent template missing: ${requiredFile.replace(`${PACKAGE_ROOT}/`, '')}`,
      ).toBe(true)
    }
  })

  it('installer completeness remains anchored on skills assets instead of prompt artifacts', () => {
    expect(existsSync(PROMPTS_DIR), 'legacy prompt references should stay in the repo').toBe(true)
    expect(REQUIRED_SKILL_FILES.length).toBeGreaterThan(0)
    expect(REQUIRED_WORKFLOW_SKILL_SECTIONS.length).toBeGreaterThan(0)
    expect(REQUIRED_WORKFLOW_SHARED_REFERENCES.length).toBeGreaterThan(0)
    expect(REQUIRED_AGENT_FILES.length).toBeGreaterThan(0)

    const codexHome = '/mock-codex-home'
    const { skillAssets, agentAssets } = getManagedPostflightPaths(codexHome)

    expect(skillAssets).toEqual(expect.arrayContaining([
      join(codexHome, 'skills', 'cxg', 'SKILL.md'),
      join(codexHome, 'skills', 'cxg', 'run_skill.js'),
      join(codexHome, 'skills', 'cxg', 'shared', 'workflow-rules.md'),
      join(codexHome, 'skills', 'cxg', 'orchestration', 'multi-agent', 'SKILL.md'),
      join(codexHome, 'skills', 'cxg', 'tools', 'lib', 'shared.js'),
      join(codexHome, 'skills', 'cxg', 'tools', 'verify-security', 'scripts', 'security_scanner.js'),
    ]))
    expect(agentAssets).toEqual(expect.arrayContaining([
      join(codexHome, '.cxg', 'agents', 'codex', 'get-current-datetime.md'),
      join(codexHome, '.cxg', 'agents', 'codex', 'planner.md'),
    ]))
    expect(skillAssets.some(path => path.includes('/prompts/'))).toBe(false)
    expect(agentAssets.some(path => path.includes('/prompts/'))).toBe(false)

    for (const commandId of ALL_COMMANDS) {
      expect(skillAssets).toContain(join(codexHome, 'skills', 'cxg', commandId, 'SKILL.md'))
    }
  })

  it('both READMEs use skills-native $cxg-* examples instead of slash commands', () => {
    for (const readmePath of README_PATHS) {
      const content = readFileSync(readmePath, 'utf-8')

      expect(
        SKILLS_NATIVE_COMMANDS.some(commandId => content.includes(`$${commandId}`)),
        `${readmePath.replace(`${PACKAGE_ROOT}/`, '')} should include at least one $cxg-* example`,
      ).toBe(true)

      for (const commandId of SKILLS_NATIVE_COMMANDS) {
        expect(
          content.includes(`/${commandId}`),
          `${readmePath.replace(`${PACKAGE_ROOT}/`, '')} should not advertise /${commandId} examples`,
        ).toBe(false)
      }
    }
  })

  it('both READMEs stop describing ~/.codex/prompts/ as the runtime entrypoint', () => {
    for (const readmePath of README_PATHS) {
      const content = readFileSync(readmePath, 'utf-8')

      expect(
        content.includes('~/.codex/prompts/'),
        `${readmePath.replace(`${PACKAGE_ROOT}/`, '')} should not describe ~/.codex/prompts/ as the runtime entrypoint`,
      ).toBe(false)
    }
  })

  it('listed role docs no longer use prompt-era For headers', () => {
    for (const roleFile of TARGET_ROLE_FILES) {
      const rolePath = join(ROLES_DIR, roleFile)
      const content = readFileSync(rolePath, 'utf-8')

      expect(
        content.includes('> For: /prompts:cxg-'),
        `${roleFile} should not use prompt-era For headers`,
      ).toBe(false)
      expect(
        content.includes('For: $cxg-'),
        `${roleFile} should describe $cxg-* skill entrypoints in the For header`,
      ).toBe(true)
    }
  })
})

describe('codex wait rule guards', () => {
  const waitRulePromptIds = [
    'cxg-analyze',
    'cxg-plan',
    'cxg-review',
    'cxg-debug',
    'cxg-optimize',
    'cxg-feat',
    'cxg-workflow',
  ]

  it('all related prompts include codex wait hard rule', () => {
    for (const promptId of waitRulePromptIds) {
      const promptPath = join(PROMPTS_DIR, `${promptId}.md`)
      const content = readFileSync(promptPath, 'utf-8')
      expect(content.includes('⛔ **Codex 结果必须等待**'), `${promptId} missing Codex wait heading`).toBe(true)
      expect(
        content.includes('禁止在 Codex 未返回结果时直接跳过或继续下一阶段'),
        `${promptId} missing non-skip guard`,
      ).toBe(true)
    }
  })

  it('cxg-feat includes conditional scope for started codex subprocess', () => {
    const featPromptPath = join(PROMPTS_DIR, 'cxg-feat.md')
    const content = readFileSync(featPromptPath, 'utf-8')
    expect(content.includes('仅当已启动 Codex 子进程任务时'), 'cxg-feat missing conditional scope').toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// C. Template variable completeness
// ─────────────────────────────────────────────────────────────
describe('template variable completeness', () => {
  const allPrompts = collectMarkdownFiles(PROMPTS_DIR)
  const allSkills = collectMarkdownFiles(SKILLS_DIR)
  const allRoles = collectMarkdownFiles(ROLES_DIR)
  const allAgents = collectMarkdownFiles(AGENTS_DIR)
  const allTemplates = [...allPrompts, ...allSkills, ...allRoles, ...allAgents]

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
        && !v.includes('ROLE_ANALYZER_FRONTEND')
        && !v.includes('ROLE_ARCHITECT')
        && !v.includes('ROLE_ARCHITECT_FRONTEND')
        && !v.includes('ROLE_DEBUGGER')
        && !v.includes('ROLE_DEBUGGER_FRONTEND')
        && !v.includes('ROLE_FRONTEND')
        && !v.includes('ROLE_OPTIMIZER')
        && !v.includes('ROLE_OPTIMIZER_FRONTEND')
        && !v.includes('ROLE_REVIEWER')
        && !v.includes('ROLE_REVIEWER_FRONTEND')
        && !v.includes('ROLE_TESTER')
        && !v.includes('ROLE_TESTER_FRONTEND')
        && !v.includes('AGENT_GET_CURRENT_DATETIME')
        && !v.includes('AGENT_INIT_ARCHITECT')
        && !v.includes('AGENT_PLANNER')
        && !v.includes('AGENT_UI_UX_DESIGNER'),
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

describe('agent template migration guards', () => {
  const legacyMarkers = [
    '.claude/plan/',
    '.claude/index.json',
    'CLAUDE.md',
  ]
  const agentDocs = collectMarkdownFiles(AGENTS_DIR)

  for (const file of agentDocs) {
    const relativePath = file.replace(`${PACKAGE_ROOT}/`, '')
    it(`${relativePath}: no legacy CLAUDE markers`, () => {
      const content = readFileSync(file, 'utf-8')
      for (const marker of legacyMarkers) {
        expect(content.includes(marker), `found legacy marker "${marker}" in ${relativePath}`).toBe(false)
      }
    })
  }
})

describe('agent template skip-mcp guards', () => {
  it('rendered tools frontmatter remains valid in skip mode', () => {
    const skipConfig = { mcpProvider: 'skip' as const }

    for (const file of REQUIRED_AGENT_FILES) {
      const content = readFileSync(file, 'utf-8')
      const rendered = injectTemplateVariables(content, skipConfig)
      const toolsLine = rendered.split('\n').find(line => line.startsWith('tools:'))

      expect(toolsLine, `${file} should contain tools frontmatter`).toBeTruthy()
      expect(toolsLine?.includes('{{MCP_SEARCH_TOOL}}'), `${file} should not keep MCP placeholder in tools`).toBe(false)
      expect(toolsLine?.includes('Glob + Grep'), `${file} tools frontmatter should not include "Glob + Grep"`).toBe(false)
    }
  })
})
