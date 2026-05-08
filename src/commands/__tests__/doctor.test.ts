import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { ALL_COMMANDS, AGENT_TEMPLATES } from '../../utils/constants'
import { buildDoctorDiagnostics } from '../doctor'

function createFileSet(codexHome: string): Set<string> {
  const files = new Set<string>()
  const skillsDir = join(codexHome, 'skills', 'cxg')
  const rolesDir = join(codexHome, '.cxg', 'roles', 'codex')
  const agentsDir = join(codexHome, '.cxg', 'agents', 'codex')
  const promptsDir = join(codexHome, 'prompts')
  const wrapperPath = join(codexHome, 'bin', 'codeagent-wrapper')

  files.add(join(codexHome, '.cxg', 'config.toml'))
  files.add(join(skillsDir, 'SKILL.md'))
  files.add(join(skillsDir, 'run_skill.js'))
  files.add(join(skillsDir, 'shared', 'workflow-rules.md'))
  files.add(join(skillsDir, 'shared', 'interaction-checkpoints.md'))
  files.add(join(skillsDir, 'shared', 'output-contracts.md'))
  files.add(join(skillsDir, 'orchestration', 'multi-agent', 'SKILL.md'))
  files.add(join(skillsDir, 'tools', 'lib', 'shared.js'))
  files.add(join(skillsDir, 'tools', 'gen-docs', 'SKILL.md'))
  files.add(join(skillsDir, 'tools', 'gen-docs', 'scripts', 'doc_generator.js'))
  files.add(join(skillsDir, 'tools', 'verify-change', 'SKILL.md'))
  files.add(join(skillsDir, 'tools', 'verify-change', 'scripts', 'change_analyzer.js'))
  files.add(join(skillsDir, 'tools', 'verify-module', 'SKILL.md'))
  files.add(join(skillsDir, 'tools', 'verify-module', 'scripts', 'module_scanner.js'))
  files.add(join(skillsDir, 'tools', 'verify-quality', 'SKILL.md'))
  files.add(join(skillsDir, 'tools', 'verify-quality', 'scripts', 'quality_checker.js'))
  files.add(join(skillsDir, 'tools', 'verify-security', 'SKILL.md'))
  files.add(join(skillsDir, 'tools', 'verify-security', 'scripts', 'security_scanner.js'))

  for (const commandId of ALL_COMMANDS) {
    files.add(join(skillsDir, commandId, 'SKILL.md'))
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
    files.add(join(rolesDir, `${role}.md`))
  }

  for (const agent of AGENT_TEMPLATES) {
    files.add(join(agentsDir, `${agent}.md`))
  }

  files.add(wrapperPath)
  files.add(join(promptsDir, 'cxg-plan.md'))

  return files
}

describe('buildDoctorDiagnostics', () => {
  it('fails when a top-level workflow skill is missing', async () => {
    const codexHome = '/mock-codex-home'
    const files = createFileSet(codexHome)
    files.delete(join(codexHome, 'skills', 'cxg', 'cxg-plan', 'SKILL.md'))

    const diagnostics = await buildDoctorDiagnostics({
      codexHome,
      exists: async path => files.has(path),
      readDir: async () => [],
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
    })
    expect(diagnostics.results.find(result => result.label.startsWith('Skills'))?.detail).toContain('skills/cxg/cxg-plan/SKILL.md')
  })

  it('reports legacy prompt files as warning-only without failing the doctor run', async () => {
    const codexHome = '/mock-codex-home'
    const files = createFileSet(codexHome)

    const diagnostics = await buildDoctorDiagnostics({
      codexHome,
      exists: async path => files.has(path),
      readDir: async dir => dir === join(codexHome, 'prompts') ? ['cxg-plan.md', 'notes.md'] : [],
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
