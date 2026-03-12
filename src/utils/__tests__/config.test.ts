import { describe, expect, it } from 'vitest'
import { createDefaultConfig } from '../config'

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

  it('defaults lite_mode to false', () => {
    const config = createDefaultConfig()
    expect(config.runtime.lite_mode).toBe(false)
  })

  it('respects liteMode = true', () => {
    const config = createDefaultConfig({ liteMode: true })
    expect(config.runtime.lite_mode).toBe(true)
  })

  it('sets paths with .codex directory', () => {
    const config = createDefaultConfig()
    expect(config.paths.prompts).toContain('.codex')
    expect(config.paths.skills).toContain('.codex')
    expect(config.paths.roles).toContain('.cxg')
    expect(config.paths.wrapper).toContain('codeagent-wrapper')
  })

  it('defaults mcp provider to skip when not specified', () => {
    const config = createDefaultConfig()
    expect(config.mcp?.provider).toBe('skip')
  })

  it('respects custom mcpProvider', () => {
    const config = createDefaultConfig({ mcpProvider: 'ace-tool' })
    expect(config.mcp?.provider).toBe('ace-tool')
  })

  it('respects contextweaver mcpProvider', () => {
    const config = createDefaultConfig({ mcpProvider: 'contextweaver' })
    expect(config.mcp?.provider).toBe('contextweaver')
  })

  it('initializes empty commands list', () => {
    const config = createDefaultConfig()
    expect(config.commands.installed).toEqual([])
  })
})
