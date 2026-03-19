import ansis from 'ansis'
import inquirer from 'inquirer'
import { version } from '../../package.json'
import { configMcp } from './config-mcp'
import { init } from './init'
import { uninstall } from './uninstall'
import { doctor } from './doctor'
import { readCxgConfig } from '../utils/config'

// ═══════════════════════════════════════════════════════
// UI Helpers
// ═══════════════════════════════════════════════════════

function visWidth(s: string): number {
  const stripped = ansis.strip(s)
  let w = 0
  for (const ch of stripped) {
    const code = ch.codePointAt(0) || 0
    if (
      (code >= 0x2E80 && code <= 0x9FFF)
      || (code >= 0xF900 && code <= 0xFAFF)
      || (code >= 0xFF00 && code <= 0xFF60)
      || (code >= 0x20000 && code <= 0x2FA1F)
    ) {
      w += 2
    }
    else {
      w += 1
    }
  }
  return w
}

function pad(s: string, w: number): string {
  const diff = w - visWidth(s)
  return diff > 0 ? s + ' '.repeat(diff) : s
}

// ═══════════════════════════════════════════════════════
// Main Menu
// ═══════════════════════════════════════════════════════

export async function showMainMenu(): Promise<void> {
  while (true) {
    const config = await readCxgConfig()
    const cmdCount = config?.commands?.installed?.length || 0
    const mcpProvider = config?.mcp?.provider || '—'

    // Header
    console.log()
    console.log(ansis.cyan.bold(`  CXG Workflow ${ansis.green(`v${version}`)}`))
    console.log(ansis.gray(`  Codex 单模型协作工作流`))

    // Status line
    const statusParts = [
      `${cmdCount} commands`,
    ]
    if (mcpProvider && mcpProvider !== '—' && mcpProvider !== 'skip') {
      statusParts.push(ansis.magenta(mcpProvider))
    }
    console.log(ansis.gray(`  ${statusParts.join('  |  ')}`))
    console.log()

    const item = (key: string, label: string, desc: string) => ({
      name: `  ${ansis.green(key + '.')} ${pad(label, 20)} ${ansis.gray('- ' + desc)}`,
      value: key,
    })

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'CXG 主菜单',
      pageSize: 12,
      choices: [
        item('1', '安装工作流', '安装 CXG 工作流到 ~/.codex/'),
        item('2', '配置 MCP', 'MCP 工具配置'),
        item('3', '诊断安装', '检查安装完整性'),
        item('4', '卸载', '移除 CXG 配置'),
        new inquirer.Separator(ansis.gray('─'.repeat(42))),
        { name: `  ${ansis.red('Q.')} 退出`, value: 'Q' },
      ],
    }])

    switch (action) {
      case '1':
        await init()
        break
      case '2':
        await configMcp()
        break
      case '3':
        await doctor()
        break
      case '4':
        await uninstall()
        break
      case 'Q':
        console.log()
        console.log(ansis.gray('  再见 👋'))
        console.log()
        return
    }

    // Pause after action
    console.log()
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: ansis.gray('按回车返回主菜单...'),
    }])
  }
}
