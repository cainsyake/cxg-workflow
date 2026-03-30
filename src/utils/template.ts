import type { McpProvider } from '../types'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { DEFAULT_MCP_PROVIDER } from './constants'
import { isWindows, normalizePath } from './platform'

/**
 * Replace template variables in content with actual paths.
 * Variables injected at install time:
 * - {{WRAPPER_BIN}} - codeagent-wrapper binary path
 * - {{ROLE_ANALYZER}} - analyzer role prompt path
 * - {{ROLE_ANALYZER_FRONTEND}} - frontend analyzer role prompt path
 * - {{ROLE_ARCHITECT}} - architect role prompt path
 * - {{ROLE_ARCHITECT_FRONTEND}} - frontend architect role prompt path
 * - {{ROLE_DEBUGGER}} - debugger role prompt path
 * - {{ROLE_DEBUGGER_FRONTEND}} - frontend debugger role prompt path
 * - {{ROLE_FRONTEND}} - frontend implementation role prompt path
 * - {{ROLE_OPTIMIZER}} - optimizer role prompt path
 * - {{ROLE_OPTIMIZER_FRONTEND}} - frontend optimizer role prompt path
 * - {{ROLE_REVIEWER}} - reviewer role prompt path
 * - {{ROLE_REVIEWER_FRONTEND}} - frontend reviewer role prompt path
 * - {{ROLE_TESTER}} - tester role prompt path
 * - {{ROLE_TESTER_FRONTEND}} - frontend tester role prompt path
 * - {{AGENT_GET_CURRENT_DATETIME}} - datetime agent prompt path
 * - {{AGENT_INIT_ARCHITECT}} - init architect agent prompt path
 * - {{AGENT_PLANNER}} - planner agent prompt path
 * - {{AGENT_UI_UX_DESIGNER}} - UI/UX agent prompt path
 * - {{LITE_MODE_FLAG}} - "--lite " or ""
 * - {{MCP_SEARCH_TOOL}} - MCP tool name or fallback
 * - {{MCP_SEARCH_PARAM}} - MCP parameter key
 */
export function injectTemplateVariables(content: string, config: {
  liteMode?: boolean
  mcpProvider?: McpProvider
}): string {
  let processed = content

  // Lite mode flag
  const liteModeFlag = config.liteMode ? '--lite ' : ''
  processed = processed.replace(/\{\{LITE_MODE_FLAG\}\}/g, liteModeFlag)

  // MCP tool injection
  const mcpProvider = config.mcpProvider || DEFAULT_MCP_PROVIDER
  if (mcpProvider === 'skip') {
    processed = processed.replace(/\{\{MCP_SEARCH_TOOL\}\}/g, 'Glob + Grep')
    processed = processed.replace(/\{\{MCP_SEARCH_PARAM\}\}/g, '')
  }
  else if (mcpProvider === 'contextweaver') {
    processed = processed.replace(/\{\{MCP_SEARCH_TOOL\}\}/g, 'mcp__contextweaver__codebase-retrieval')
    processed = processed.replace(/\{\{MCP_SEARCH_PARAM\}\}/g, 'information_request')
  }
  else {
    // ace-tool (default)
    processed = processed.replace(/\{\{MCP_SEARCH_TOOL\}\}/g, 'mcp__ace-tool__search_context')
    processed = processed.replace(/\{\{MCP_SEARCH_PARAM\}\}/g, 'query')
  }

  return processed
}

/**
 * Replace ~ paths in template content with absolute paths.
 * Uses forward slashes for cross-platform compatibility.
 */
export function replaceHomePathsInTemplate(content: string, codexHome: string): string {
  const userHome = homedir()
  const cxgDir = join(codexHome, '.cxg')
  const rolesDir = join(cxgDir, 'roles', 'codex')
  const agentsDir = join(cxgDir, 'agents', 'codex')
  const binDir = join(codexHome, 'bin')

  const norm = (path: string) => normalizePath(path)

  let processed = content

  // Replace wrapper binary path (with .exe on Windows)
  const wrapperName = isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'
  const wrapperPath = `${norm(binDir)}/${wrapperName}`
  processed = processed.replace(/\{\{WRAPPER_BIN\}\}/g, wrapperPath)

  // Replace role prompt paths
  processed = processed.replace(/\{\{ROLE_ANALYZER\}\}/g, `${norm(rolesDir)}/analyzer.md`)
  processed = processed.replace(/\{\{ROLE_ANALYZER_FRONTEND\}\}/g, `${norm(rolesDir)}/analyzer-frontend.md`)
  processed = processed.replace(/\{\{ROLE_ARCHITECT\}\}/g, `${norm(rolesDir)}/architect.md`)
  processed = processed.replace(/\{\{ROLE_ARCHITECT_FRONTEND\}\}/g, `${norm(rolesDir)}/architect-frontend.md`)
  processed = processed.replace(/\{\{ROLE_DEBUGGER\}\}/g, `${norm(rolesDir)}/debugger.md`)
  processed = processed.replace(/\{\{ROLE_DEBUGGER_FRONTEND\}\}/g, `${norm(rolesDir)}/debugger-frontend.md`)
  processed = processed.replace(/\{\{ROLE_FRONTEND\}\}/g, `${norm(rolesDir)}/frontend.md`)
  processed = processed.replace(/\{\{ROLE_OPTIMIZER\}\}/g, `${norm(rolesDir)}/optimizer.md`)
  processed = processed.replace(/\{\{ROLE_OPTIMIZER_FRONTEND\}\}/g, `${norm(rolesDir)}/optimizer-frontend.md`)
  processed = processed.replace(/\{\{ROLE_REVIEWER\}\}/g, `${norm(rolesDir)}/reviewer.md`)
  processed = processed.replace(/\{\{ROLE_REVIEWER_FRONTEND\}\}/g, `${norm(rolesDir)}/reviewer-frontend.md`)
  processed = processed.replace(/\{\{ROLE_TESTER\}\}/g, `${norm(rolesDir)}/tester.md`)
  processed = processed.replace(/\{\{ROLE_TESTER_FRONTEND\}\}/g, `${norm(rolesDir)}/tester-frontend.md`)
  processed = processed.replace(/\{\{AGENT_GET_CURRENT_DATETIME\}\}/g, `${norm(agentsDir)}/get-current-datetime.md`)
  processed = processed.replace(/\{\{AGENT_INIT_ARCHITECT\}\}/g, `${norm(agentsDir)}/init-architect.md`)
  processed = processed.replace(/\{\{AGENT_PLANNER\}\}/g, `${norm(agentsDir)}/planner.md`)
  processed = processed.replace(/\{\{AGENT_UI_UX_DESIGNER\}\}/g, `${norm(agentsDir)}/ui-ux-designer.md`)

  // Replace ~/.codex/.cxg with absolute path
  processed = processed.replace(/~\/\.codex\/\.cxg/g, norm(cxgDir))

  // Replace ~/.codex/bin with absolute path
  processed = processed.replace(/~\/\.codex\/bin/g, norm(binDir))

  // Replace ~/.codex with absolute path
  processed = processed.replace(/~\/\.codex/g, norm(codexHome))

  // Replace remaining ~/ patterns
  processed = processed.replace(/~\//g, `${norm(userHome)}/`)

  return processed
}
