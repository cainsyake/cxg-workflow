import { describe, expect, it } from 'vitest'
import { createDefaultConfig, normalizeCxgConfig } from '../config'

describe('createDefaultConfig', () => {
  it('sets version from package.json', () => {
    const config = createDefaultConfig()
    expect(config.general.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('sets created_at as ISO string', () => {
    const config = createDefaultConfig()
    expect(() => new Date(config.general.created_at)).not.toThrow()
    expect(new Date(config.general.created_at).toISOString()).toBe(config.general.created_at)
  })

  it('sets backend to codex', () => {
    const config = createDefaultConfig()
    expect(config.runtime.backend).toBe('codex')
  })

  it('defaults lite_mode to true', () => {
    const config = createDefaultConfig()
    expect(config.runtime.lite_mode).toBe(true)
  })

  it('respects liteMode = false', () => {
    const config = createDefaultConfig({ liteMode: false })
    expect(config.runtime.lite_mode).toBe(false)
  })

  it('sets paths with .codex directory', () => {
    const config = createDefaultConfig()
    expect(config.paths.skills).toContain('.codex')
    expect(config.paths.roles).toContain('.cxg')
    expect(config.paths.agents).toContain('.cxg')
    expect(config.paths.wrapper).toContain('codeagent-wrapper')
  })

  it('defaults mcp provider to ace-tool when not specified', () => {
    const config = createDefaultConfig()
    expect(config.mcp?.provider).toBe('ace-tool')
  })

  it('respects custom mcpProvider', () => {
    const config = createDefaultConfig({ mcpProvider: 'ace-tool' })
    expect(config.mcp?.provider).toBe('ace-tool')
  })

  it('respects contextweaver mcpProvider', () => {
    const config = createDefaultConfig({ mcpProvider: 'contextweaver' })
    expect(config.mcp?.provider).toBe('contextweaver')
  })

  it('omits legacy prompts path and initializes empty installed skills', () => {
    const config = createDefaultConfig()
    expect(config.paths).not.toHaveProperty('prompts')
    expect(config.skills.installed).toEqual([])
  })
})

describe('normalizeCxgConfig', () => {
  it('upgrades legacy commands.installed and strips legacy-only fields', () => {
    const normalized = normalizeCxgConfig({
      general: {
        version: '1.2.3',
        created_at: '2026-05-08T00:00:00.000Z',
      },
      runtime: {
        backend: 'codex',
        lite_mode: true,
      },
      paths: {
        prompts: '/tmp/.codex/prompts',
        skills: '/tmp/.codex/skills/cxg',
        roles: '/tmp/.codex/.cxg/roles/codex',
        agents: '/tmp/.codex/.cxg/agents/codex',
        wrapper: '/tmp/.codex/bin/codeagent-wrapper',
      },
      commands: {
        installed: ['cxg-plan', 'cxg-review'],
      },
      mcp: {
        provider: 'ace-tool',
      },
    })

    expect(normalized.skills.installed).toEqual(['cxg-plan', 'cxg-review'])
    expect(normalized.paths).not.toHaveProperty('prompts')
    expect(normalized).not.toHaveProperty('commands')
  })
})
