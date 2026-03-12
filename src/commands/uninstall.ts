import fs from 'fs-extra'
import { uninstallCxg } from '../utils/installer'
import { uninstallMcpServer } from '../utils/mcp'
import { getConfigPath } from '../utils/config'

export async function uninstall(): Promise<void> {
  console.log()
  console.log('  卸载 CXG Workflow...')
  console.log()

  // 1. Remove prompts, skills, roles, binary
  const result = await uninstallCxg()

  if (result.removedPrompts.length > 0) {
    console.log(`  ✓ 已移除 ${result.removedPrompts.length} 个 Custom Prompts`)
  }
  if (result.removedSkills.length > 0) {
    console.log(`  ✓ 已移除 ${result.removedSkills.length} 个 Skills`)
  }
  if (result.removedRoles.length > 0) {
    console.log(`  ✓ 已移除角色提示词: ${result.removedRoles.join(', ')}`)
  }
  if (result.removedBin) {
    console.log('  ✓ 已移除 codeagent-wrapper')
  }

  // 2. Remove MCP servers
  const mcpErrors: string[] = []
  const aceResult = await uninstallMcpServer('ace-tool')
  if (!aceResult.success) {
    mcpErrors.push(aceResult.message)
  }
  const cwResult = await uninstallMcpServer('contextweaver')
  if (!cwResult.success) {
    mcpErrors.push(cwResult.message)
  }

  if (mcpErrors.length > 0) {
    console.log('  ⚠ MCP 清理部分失败:')
    for (const err of mcpErrors) {
      console.log(`    ✗ ${err}`)
    }
  }
  else {
    console.log('  ✓ 已清理 MCP 配置')
  }

  // 3. Remove config
  const configPath = getConfigPath()
  if (await fs.pathExists(configPath)) {
    await fs.remove(configPath)
    console.log('  ✓ 已移除配置文件')
  }

  // Summary
  console.log()
  if (result.errors.length > 0) {
    console.log('  ⚠ 卸载完成，但有以下错误:')
    for (const error of result.errors) {
      console.log(`    ✗ ${error}`)
    }
  }
  else {
    console.log('  ✓ 卸载完成!')
  }
  console.log()
}
