import { describe, expect, it } from 'vitest'
import { injectTemplateVariables, replaceHomePathsInTemplate } from '../template'

// ─────────────────────────────────────────────────────────────
// A. injectTemplateVariables — liteMode
// ─────────────────────────────────────────────────────────────
describe('injectTemplateVariables — liteMode', () => {
  it('injects --lite flag when liteMode is true', () => {
    const input = 'codeagent-wrapper {{LITE_MODE_FLAG}}--backend codex'
    const result = injectTemplateVariables(input, { liteMode: true })
    expect(result).toBe('codeagent-wrapper --lite --backend codex')
  })

  it('injects empty string when liteMode is false', () => {
    const input = 'codeagent-wrapper {{LITE_MODE_FLAG}}--backend codex'
    const result = injectTemplateVariables(input, { liteMode: false })
    expect(result).toBe('codeagent-wrapper --backend codex')
  })

  it('injects empty string when liteMode is not specified', () => {
    const input = 'codeagent-wrapper {{LITE_MODE_FLAG}}--backend codex'
    const result = injectTemplateVariables(input, {})
    expect(result).toBe('codeagent-wrapper --backend codex')
  })
})

// ─────────────────────────────────────────────────────────────
// B. injectTemplateVariables — MCP provider
// ─────────────────────────────────────────────────────────────
describe('injectTemplateVariables — mcpProvider=skip', () => {
  const config = { mcpProvider: 'skip' as const }

  it('replaces MCP_SEARCH_TOOL with Glob + Grep', () => {
    const input = '{{MCP_SEARCH_TOOL}}'
    const result = injectTemplateVariables(input, config)
    expect(result).toBe('Glob + Grep')
  })

  it('clears MCP_SEARCH_PARAM', () => {
    const input = '{{MCP_SEARCH_PARAM}}'
    const result = injectTemplateVariables(input, config)
    expect(result).toBe('')
  })
})

describe('injectTemplateVariables — mcpProvider=ace-tool', () => {
  it('replaces MCP_SEARCH_TOOL with ace-tool tool name', () => {
    const input = '{{MCP_SEARCH_TOOL}}'
    const result = injectTemplateVariables(input, { mcpProvider: 'ace-tool' })
    expect(result).toBe('mcp__ace-tool__search_context')
  })

  it('replaces MCP_SEARCH_PARAM with query', () => {
    const input = '{{MCP_SEARCH_PARAM}}'
    const result = injectTemplateVariables(input, { mcpProvider: 'ace-tool' })
    expect(result).toBe('query')
  })

  it('defaults to ace-tool when mcpProvider is not specified', () => {
    const input = '{{MCP_SEARCH_TOOL}}'
    const result = injectTemplateVariables(input, {})
    expect(result).toBe('mcp__ace-tool__search_context')
  })
})

describe('injectTemplateVariables — mcpProvider=contextweaver', () => {
  it('replaces MCP_SEARCH_TOOL with contextweaver tool name', () => {
    const input = '{{MCP_SEARCH_TOOL}}'
    const result = injectTemplateVariables(input, { mcpProvider: 'contextweaver' })
    expect(result).toBe('mcp__contextweaver__codebase-retrieval')
  })

  it('replaces MCP_SEARCH_PARAM with information_request', () => {
    const input = '{{MCP_SEARCH_PARAM}}'
    const result = injectTemplateVariables(input, { mcpProvider: 'contextweaver' })
    expect(result).toBe('information_request')
  })
})

// ─────────────────────────────────────────────────────────────
// C. replaceHomePathsInTemplate
// ─────────────────────────────────────────────────────────────
describe('replaceHomePathsInTemplate', () => {
  const codexHome = '/home/testuser/.codex'

  it('replaces WRAPPER_BIN with absolute path', () => {
    const input = '{{WRAPPER_BIN}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toContain('/home/testuser/.codex/bin/codeagent-wrapper')
  })

  it('replaces ROLE_ANALYZER with absolute path', () => {
    const input = '{{ROLE_ANALYZER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/analyzer.md')
  })

  it('replaces ROLE_ARCHITECT with absolute path', () => {
    const input = '{{ROLE_ARCHITECT}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/architect.md')
  })

  it('replaces ROLE_REVIEWER with absolute path', () => {
    const input = '{{ROLE_REVIEWER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/reviewer.md')
  })

  it('replaces ~/.codex/.cxg with absolute path', () => {
    const input = '~/.codex/.cxg/config.toml'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/config.toml')
  })

  it('replaces ~/.codex/bin with absolute path', () => {
    const input = '~/.codex/bin/codeagent-wrapper'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/bin/codeagent-wrapper')
  })

  it('replaces ~/.codex with absolute path', () => {
    const input = '~/.codex/prompts'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/prompts')
  })

  it('handles multiple replacements in one content', () => {
    const input = 'wrapper: {{WRAPPER_BIN}}\nanalyzer: {{ROLE_ANALYZER}}\nconfig: ~/.codex/.cxg/config.toml'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toContain('/home/testuser/.codex/bin/codeagent-wrapper')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/analyzer.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/config.toml')
    expect(result).not.toContain('~/')
    expect(result).not.toContain('{{')
  })
})
