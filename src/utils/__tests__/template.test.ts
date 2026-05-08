import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

  it('removes MCP tool placeholder from tools frontmatter list', () => {
    const input = 'tools: Read, Write, {{MCP_SEARCH_TOOL}}'
    const result = injectTemplateVariables(input, config)
    expect(result).toBe('tools: Read, Write')
  })

  it('replaces MCP tool code block with fallback guidance', () => {
    const input = [
      '```text',
      '{{MCP_SEARCH_TOOL}} {',
      '  "project_root_path": "{{PROJECT_ROOT}}",',
      '  "query": "keyword"',
      '}',
      '```',
    ].join('\n')
    const result = injectTemplateVariables(input, config)
    expect(result).toContain('MCP 未配置')
    expect(result).not.toContain('{{MCP_SEARCH_TOOL}}')
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

  it('replaces ROLE_ANALYZER_FRONTEND with absolute path', () => {
    const input = '{{ROLE_ANALYZER_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/analyzer-frontend.md')
  })

  it('replaces ROLE_ARCHITECT with absolute path', () => {
    const input = '{{ROLE_ARCHITECT}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/architect.md')
  })

  it('replaces ROLE_ARCHITECT_FRONTEND with absolute path', () => {
    const input = '{{ROLE_ARCHITECT_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/architect-frontend.md')
  })

  it('replaces ROLE_DEBUGGER with absolute path', () => {
    const input = '{{ROLE_DEBUGGER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/debugger.md')
  })

  it('replaces ROLE_DEBUGGER_FRONTEND with absolute path', () => {
    const input = '{{ROLE_DEBUGGER_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/debugger-frontend.md')
  })

  it('replaces ROLE_FRONTEND with absolute path', () => {
    const input = '{{ROLE_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/frontend.md')
  })

  it('replaces ROLE_OPTIMIZER with absolute path', () => {
    const input = '{{ROLE_OPTIMIZER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/optimizer.md')
  })

  it('replaces ROLE_OPTIMIZER_FRONTEND with absolute path', () => {
    const input = '{{ROLE_OPTIMIZER_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/optimizer-frontend.md')
  })

  it('replaces ROLE_REVIEWER with absolute path', () => {
    const input = '{{ROLE_REVIEWER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/reviewer.md')
  })

  it('replaces ROLE_REVIEWER_FRONTEND with absolute path', () => {
    const input = '{{ROLE_REVIEWER_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/reviewer-frontend.md')
  })

  it('replaces ROLE_TESTER with absolute path', () => {
    const input = '{{ROLE_TESTER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/tester.md')
  })

  it('replaces ROLE_TESTER_FRONTEND with absolute path', () => {
    const input = '{{ROLE_TESTER_FRONTEND}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/roles/codex/tester-frontend.md')
  })

  it('replaces AGENT_GET_CURRENT_DATETIME with absolute path', () => {
    const input = '{{AGENT_GET_CURRENT_DATETIME}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/agents/codex/get-current-datetime.md')
  })

  it('replaces AGENT_INIT_ARCHITECT with absolute path', () => {
    const input = '{{AGENT_INIT_ARCHITECT}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/agents/codex/init-architect.md')
  })

  it('replaces AGENT_PLANNER with absolute path', () => {
    const input = '{{AGENT_PLANNER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/agents/codex/planner.md')
  })

  it('replaces AGENT_UI_UX_DESIGNER with absolute path', () => {
    const input = '{{AGENT_UI_UX_DESIGNER}}'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toBe('/home/testuser/.codex/.cxg/agents/codex/ui-ux-designer.md')
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
    const input = 'wrapper: {{WRAPPER_BIN}}\nanalyzer: {{ROLE_ANALYZER}}\nanalyzerFrontend: {{ROLE_ANALYZER_FRONTEND}}\narchitectFrontend: {{ROLE_ARCHITECT_FRONTEND}}\ndebugger: {{ROLE_DEBUGGER}}\ndebuggerFrontend: {{ROLE_DEBUGGER_FRONTEND}}\nfrontend: {{ROLE_FRONTEND}}\noptimizer: {{ROLE_OPTIMIZER}}\noptimizerFrontend: {{ROLE_OPTIMIZER_FRONTEND}}\nreviewerFrontend: {{ROLE_REVIEWER_FRONTEND}}\ntester: {{ROLE_TESTER}}\ntesterFrontend: {{ROLE_TESTER_FRONTEND}}\nagentDatetime: {{AGENT_GET_CURRENT_DATETIME}}\nagentInitArchitect: {{AGENT_INIT_ARCHITECT}}\nagentPlanner: {{AGENT_PLANNER}}\nagentUiUxDesigner: {{AGENT_UI_UX_DESIGNER}}\nconfig: ~/.codex/.cxg/config.toml'
    const result = replaceHomePathsInTemplate(input, codexHome)
    expect(result).toContain('/home/testuser/.codex/bin/codeagent-wrapper')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/analyzer.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/analyzer-frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/architect-frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/debugger.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/debugger-frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/optimizer.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/optimizer-frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/reviewer-frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/tester.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/roles/codex/tester-frontend.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/agents/codex/get-current-datetime.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/agents/codex/init-architect.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/agents/codex/planner.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/agents/codex/ui-ux-designer.md')
    expect(result).toContain('/home/testuser/.codex/.cxg/config.toml')
    expect(result).not.toContain('~/')
    expect(result).not.toContain('{{')
  })
})

describe('runtime helper artifacts', () => {
  it('does not write cxg prompt helpers into ~/.codex/prompts', () => {
    const configMcpSource = readFileSync(
      join(import.meta.dirname, '..', '..', 'commands', 'config-mcp.ts'),
      'utf-8',
    )

    expect(configMcpSource.includes('cxg-grok-search.md')).toBe(false)
    expect(configMcpSource.includes("join(homedir(), '.codex', 'prompts')")).toBe(false)
    expect(configMcpSource.includes('~/.codex/prompts/cxg-grok-search.md')).toBe(false)
  })
})
