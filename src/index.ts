// Types
export type {
  CxgConfig,
  McpProvider,
  InstallResult,
  UninstallResult,
  WorkflowConfig,
  AceToolConfig,
  ContextWeaverConfig,
} from './types'

// Commands
export { init } from './commands/init'
export { uninstall } from './commands/uninstall'
export { doctor } from './commands/doctor'
export { update } from './commands/update'
export { showVersion } from './commands/version'

// Config
export {
  readCxgConfig,
  writeCxgConfig,
  createDefaultConfig,
  getCodexHome,
  getCxgDir,
  getConfigPath,
} from './utils/config'

// Installer
export {
  installCxg,
  uninstallCxg,
  getWorkflowConfigs,
  getAllCommandIds,
} from './utils/installer'

// Version
export {
  getCurrentVersion,
  getLatestVersion,
  checkForUpdates,
  compareVersions,
} from './utils/version'

// MCP
export {
  installAceTool,
  installContextWeaver,
  uninstallMcpServer,
} from './utils/mcp'

// Constants
export { ALL_COMMANDS, WORKFLOW_CONFIGS } from './utils/constants'
