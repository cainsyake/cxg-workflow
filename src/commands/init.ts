import type { InitOptions } from '../types/cli'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { version } from '../../package.json'
import { createDefaultConfig, writeCxgConfig } from '../utils/config'
import { ALL_COMMANDS, DEFAULT_MCP_PROVIDER } from '../utils/constants'
import { showBinaryDownloadWarning } from '../utils/binary'
import { installCxg } from '../utils/installer'
import { installAceTool } from '../utils/mcp'

export async function init(options: InitOptions = {}): Promise<void> {
  console.log()
  console.log(`  CXG Workflow v${version}`)
  console.log(`  Codex 单模型协作工作流`)
  console.log()

  const { force = false, liteMode = true, mcpProvider = DEFAULT_MCP_PROVIDER } = options

  // 1. Install prompts + skills + roles + binary
  console.log('  [1/3] 安装工作流组件...')
  const result = await installCxg({ force, liteMode, mcpProvider })

  if (result.installedPrompts.length > 0) {
    console.log(`    ✓ Custom Prompts: ${result.installedPrompts.length} 个`)
  }
  if (result.installedSkills.length > 0) {
    console.log(`    ✓ Skills: ${result.installedSkills.length} 个`)
  }
  if (result.installedRoles.length > 0) {
    console.log(`    ✓ 角色提示词: ${result.installedRoles.join(', ')}`)
  }
  if (result.binInstalled) {
    console.log(`    ✓ codeagent-wrapper → ${result.binPath}`)
  }

  // 2. Configure MCP if requested
  if (mcpProvider !== 'skip') {
    console.log()
    console.log('  [2/3] 配置 MCP 代码检索...')

    if (mcpProvider === 'ace-tool') {
      const aceResult = await installAceTool({})
      if (aceResult.success) {
        console.log(`    ✓ ${aceResult.message}`)
      }
      else {
        console.log(`    ✗ ${aceResult.message}`)
      }
    }
    else if (mcpProvider === 'contextweaver') {
      console.log(`    ⚠ ContextWeaver 需要 SiliconFlow API Key`)
      console.log(`      请手动配置: ~/.contextweaver/.env`)
    }
  }
  else {
    console.log()
    console.log('  [2/3] MCP 配置 (已跳过)')
    console.log('    提示: 使用 --mcp ace-tool 或 --mcp contextweaver 启用代码检索')
  }

  // 3. Save config
  console.log()
  console.log('  [3/3] 保存配置...')
  const installedCommands = result.success
    ? [...ALL_COMMANDS]
    : result.installedPrompts

  const hasInstalledArtifacts = installedCommands.length > 0
    || result.installedSkills.length > 0
    || result.installedRoles.length > 0
    || Boolean(result.binInstalled)

  if (hasInstalledArtifacts) {
    const config = createDefaultConfig({
      mcpProvider,
      liteMode,
      binary: {
        source: result.binSource,
        checksum_status: result.binChecksumStatus,
        verified_at: result.binInstalled ? new Date().toISOString() : undefined,
        version: result.binVersion,
      },
    })
    config.commands.installed = installedCommands
    await writeCxgConfig(config)
    console.log('    ✓ ~/.codex/.cxg/config.toml')
  }
  else {
    console.log('    ✗ 未写入配置（安装未产生有效产物）')
  }

  // Summary
  console.log()
  if (result.errors.length > 0) {
    console.log('  ⚠ 安装完成，但有以下错误:')
    for (const error of result.errors) {
      console.log(`    ✗ ${error}`)
    }
  }
  else {
    console.log('  ✓ 安装完成!')
  }

  if (!result.binInstalled) {
    showBinaryDownloadWarning(join(homedir(), '.codex', 'bin'))
  }

  console.log()
  console.log('  已安装命令:')
  if (installedCommands.length === 0) {
    console.log('    (无)')
  }
  else {
    for (const cmd of installedCommands) {
      console.log(`    /${cmd}`)
    }
  }

  console.log()
  console.log('  使用方法: 在 Codex CLI 中输入 /<命令名> 调用')
  console.log()
}
