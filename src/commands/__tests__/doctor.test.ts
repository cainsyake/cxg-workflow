import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { ALL_COMMANDS, AGENT_TEMPLATES } from '../../utils/constants'
import { buildDoctorDiagnostics } from '../doctor'

interface MockTree {
  files: Set<string>
  dirs: Set<string>
}

function addFile(tree: MockTree, path: string): void {
  tree.files.add(path)

  const segments = path.split('/').filter(Boolean)
  let current = path.startsWith('/') ? '/' : ''

  for (let index = 0; index < segments.length - 1; index++) {
    current = current === '/' ? `/${segments[index]}` : `${current}/${segments[index]}`
    tree.dirs.add(current)
  }
}

function createMockTree(codexHome: string): MockTree {
  const tree: MockTree = {
    files: new Set<string>(),
    dirs: new Set<string>(['/']),
  }

  const skillsDir = join(codexHome, 'skills', 'cxg')
  const rolesDir = join(codexHome, '.cxg', 'roles', 'codex')
  const agentsDir = join(codexHome, '.cxg', 'agents', 'codex')
  const promptsDir = join(codexHome, 'prompts')
  const wrapperPath = join(codexHome, 'bin', 'codeagent-wrapper')

  addFile(tree, join(codexHome, '.cxg', 'config.toml'))
  addFile(tree, join(skillsDir, 'SKILL.md'))
  addFile(tree, join(skillsDir, 'run_skill.js'))
  addFile(tree, join(skillsDir, 'shared', 'workflow-rules.md'))
  addFile(tree, join(skillsDir, 'shared', 'interaction-checkpoints.md'))
  addFile(tree, join(skillsDir, 'shared', 'output-contracts.md'))
  addFile(tree, join(skillsDir, 'orchestration', 'multi-agent', 'SKILL.md'))
  addFile(tree, join(skillsDir, 'tools', 'lib', 'shared.js'))
  addFile(tree, join(skillsDir, 'tools', 'gen-docs', 'SKILL.md'))
  addFile(tree, join(skillsDir, 'tools', 'gen-docs', 'scripts', 'doc_generator.js'))
  addFile(tree, join(skillsDir, 'tools', 'verify-change', 'SKILL.md'))
  addFile(tree, join(skillsDir, 'tools', 'verify-change', 'scripts', 'change_analyzer.js'))
  addFile(tree, join(skillsDir, 'tools', 'verify-module', 'SKILL.md'))
  addFile(tree, join(skillsDir, 'tools', 'verify-module', 'scripts', 'module_scanner.js'))
  addFile(tree, join(skillsDir, 'tools', 'verify-quality', 'SKILL.md'))
  addFile(tree, join(skillsDir, 'tools', 'verify-quality', 'scripts', 'quality_checker.js'))
  addFile(tree, join(skillsDir, 'tools', 'verify-security', 'SKILL.md'))
  addFile(tree, join(skillsDir, 'tools', 'verify-security', 'scripts', 'security_scanner.js'))

  for (const commandId of ALL_COMMANDS) {
    addFile(tree, join(skillsDir, commandId, 'SKILL.md'))
  }

  for (const role of [
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
  ]) {
    addFile(tree, join(rolesDir, `${role}.md`))
  }

  for (const agent of AGENT_TEMPLATES) {
    addFile(tree, join(agentsDir, `${agent}.md`))
  }

  addFile(tree, wrapperPath)
  addFile(tree, join(promptsDir, 'cxg-plan.md'))

  return tree
}

function createMockFs(codexHome: string) {
  const tree = createMockTree(codexHome)

  return {
    tree,
    exists: async (path: string) => tree.files.has(path) || tree.dirs.has(path),
    readDir: async (path: string) => {
      if (!tree.dirs.has(path)) {
        throw Object.assign(new Error(`ENOTDIR: not a directory, scandir '${path}'`), { code: 'ENOTDIR' })
      }

      const children = new Set<string>()
      const prefix = `${path}/`
      for (const entry of [...tree.files, ...tree.dirs]) {
        if (!entry.startsWith(prefix) || entry === path) {
          continue
        }

        const remainder = entry.slice(prefix.length)
        if (remainder.length === 0 || remainder.includes('/')) {
          children.add(remainder.split('/')[0])
          continue
        }

        children.add(remainder)
      }

      return [...children]
    },
  }
}

describe('buildDoctorDiagnostics', () => {
  it('counts nested skill definitions and fails when a workflow skill file is missing', async () => {
    const codexHome = '/mock-codex-home'
    const { tree, exists, readDir } = createMockFs(codexHome)
    tree.files.delete(join(codexHome, 'skills', 'cxg', 'cxg-plan', 'SKILL.md'))

    const diagnostics = await buildDoctorDiagnostics({
      codexHome,
      exists,
      readDir,
      readConfig: async () => ({
        general: {
          version: '1.0.0',
          created_at: '2026-05-08T00:00:00.000Z',
        },
        runtime: {
          backend: 'codex',
          lite_mode: true,
        },
        paths: {
          skills: join(codexHome, 'skills', 'cxg'),
          roles: join(codexHome, '.cxg', 'roles', 'codex'),
          agents: join(codexHome, '.cxg', 'agents', 'codex'),
          wrapper: join(codexHome, 'bin', 'codeagent-wrapper'),
        },
        skills: {
          installed: [...ALL_COMMANDS],
        },
        mcp: {
          provider: 'skip',
        },
      }),
      getBinaryStatus: async () => ({
        exists: true,
        healthy: true,
        version: '1.2.3',
      }),
    })

    expect(diagnostics.ok).toBe(false)
    expect(diagnostics.results.find(result => result.label.startsWith('Skills'))).toMatchObject({
      ok: false,
      label: `Skills (${ALL_COMMANDS.length + 5} 个定义)`,
    })
    expect(diagnostics.results.find(result => result.label.startsWith('Skills'))?.detail).toContain('skills/cxg/cxg-plan/SKILL.md')
  })

  it('reports legacy prompt files as warning-only without failing the doctor run', async () => {
    const codexHome = '/mock-codex-home'
    const { exists, readDir } = createMockFs(codexHome)

    const diagnostics = await buildDoctorDiagnostics({
      codexHome,
      exists,
      readDir,
      readConfig: async () => ({
        general: {
          version: '1.0.0',
          created_at: '2026-05-08T00:00:00.000Z',
        },
        runtime: {
          backend: 'codex',
          lite_mode: true,
        },
        paths: {
          skills: join(codexHome, 'skills', 'cxg'),
          roles: join(codexHome, '.cxg', 'roles', 'codex'),
          agents: join(codexHome, '.cxg', 'agents', 'codex'),
          wrapper: join(codexHome, 'bin', 'codeagent-wrapper'),
        },
        skills: {
          installed: [...ALL_COMMANDS],
        },
        mcp: {
          provider: 'skip',
        },
      }),
      getBinaryStatus: async () => ({
        exists: true,
        healthy: true,
        version: '1.2.3',
      }),
    })

    const legacyPrompts = diagnostics.results.find(result => result.label === '遗留 Prompt 文件')

    expect(diagnostics.ok).toBe(true)
    expect(legacyPrompts).toMatchObject({
      ok: true,
      severity: 'warning',
    })
    expect(legacyPrompts?.detail).toContain('cxg-plan')
  })
})
