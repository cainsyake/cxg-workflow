import type { McpProvider } from './types'
import type { CAC } from 'cac'
import type { CliOptions, UpdateCliOptions, VersionCliOptions } from './types/cli'
import { version } from '../package.json'
import { init } from './commands/init'
import { uninstall } from './commands/uninstall'
import { doctor } from './commands/doctor'
import { showMainMenu } from './commands/menu'
import { configMcp } from './commands/config-mcp'
import { update } from './commands/update'
import { showVersion } from './commands/version'
import { DEFAULT_MCP_PROVIDER } from './utils/constants'

const VALID_MCP_PROVIDERS: McpProvider[] = ['skip', 'ace-tool', 'contextweaver']

export function setupCommands(cli: CAC): void {
  // Default command - show menu
  cli
    .command('', 'CXG Workflow - Codex 单模型协作工作流')
    .action(async () => {
      await showMainMenu()
    })

  // Menu command (explicit)
  cli
    .command('menu', 'CXG 交互式菜单')
    .alias('m')
    .action(async () => {
      await showMainMenu()
    })

  // Init command
  cli
    .command('init', '安装 CXG 工作流到 ~/.codex/')
    .alias('i')
    .option('--force, -f', '强制覆盖已有文件')
    .option('--lite', '精简模式（默认开启，禁用 WebUI；可用 --no-lite 关闭）', { default: true })
    .option('--mcp <provider>', 'MCP 代码检索提供者 (ace-tool|contextweaver|skip)', { default: DEFAULT_MCP_PROVIDER })
    .option('--skip-mcp', '跳过 MCP 配置')
    .action(async (options: CliOptions) => {
      const provider = options.skipMcp ? 'skip' : (options.mcp || DEFAULT_MCP_PROVIDER)
      if (!VALID_MCP_PROVIDERS.includes(provider as McpProvider)) {
        console.error(`  ✗ 无效的 MCP provider: ${provider}`)
        console.error(`    有效值: ${VALID_MCP_PROVIDERS.join(', ')}`)
        process.exitCode = 1
        return
      }
      await init({
        force: options.force,
        liteMode: options.lite,
        mcpProvider: provider as McpProvider,
      })
    })

  // Config MCP command
  cli
    .command('config-mcp', '配置 MCP 工具')
    .action(async () => {
      await configMcp()
    })

  // Uninstall command
  cli
    .command('uninstall', '卸载 CXG 工作流')
    .alias('rm')
    .action(async () => {
      await uninstall()
    })

  // Doctor command
  cli
    .command('doctor', '诊断 CXG 安装完整性')
    .action(async () => {
      await doctor()
    })

  // Update command
  cli
    .command('update', '更新 CXG 并在失败时自动回滚')
    .alias('up')
    .option('--yes, -y', '跳过确认，直接更新')
    .action(async (options: UpdateCliOptions) => {
      await update({
        yes: options.yes,
      })
    })

  // Version command
  cli
    .command('version', '显示 CXG 版本状态')
    .option('--check', '检查 npm 最新版本')
    .action(async (options: VersionCliOptions) => {
      await showVersion({
        check: options.check,
      })
    })

  cli.help()
  cli.version(version)
}
