import type { CxgConfig } from '../types'
import ansis from 'ansis'
import inquirer from 'inquirer'
import { version } from '../../package.json'
import { DEFAULT_MCP_PROVIDER } from '../utils/constants'
import { configMcp } from './config-mcp'
import { init } from './init'
import { uninstall } from './uninstall'
import { doctor } from './doctor'
import { update } from './update'
import { showVersion } from './version'
import { createDefaultConfig, readCxgConfig, writeCxgConfig } from '../utils/config'
import { installCxg } from '../utils/installer'

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
    const liteMode = config?.runtime?.lite_mode ?? true

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
    statusParts.push(liteMode ? ansis.green('lite:on') : ansis.yellow('lite:off'))
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
        item('5', '设置 Lite 模式', '选择子进程 --lite 开关并重渲染模板'),
        item('6', '更新', '执行原子更新，失败自动回滚'),
        item('7', '版本状态', '查看 CLI/本地/binary 版本'),
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
      case '5':
        await toggleLiteMode(config)
        break
      case '6':
        await update()
        break
      case '7':
        await showVersion({ check: true })
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

async function toggleLiteMode(config: CxgConfig | null): Promise<void> {
  if (!config) {
    console.log()
    console.log(ansis.yellow('  ⚠ 未检测到 CXG 配置，请先执行“安装工作流”'))
    return
  }

  const current = config.runtime?.lite_mode ?? true
  const provider = config.mcp?.provider || DEFAULT_MCP_PROVIDER

  console.log()
  console.log(ansis.cyan.bold('  Lite 模式设置'))
  console.log(ansis.gray(`  当前: ${current ? '开启' : '关闭'}`))
  console.log()

  const { target } = await inquirer.prompt([{
    type: 'list',
    name: 'target',
    message: '请选择 Lite 模式目标状态',
    choices: [
      { name: `开启${current ? '（当前）' : ''}`, value: 'on' },
      { name: `关闭${!current ? '（当前）' : ''}`, value: 'off' },
      { name: '取消', value: 'cancel' },
    ],
    default: current ? 0 : 1,
  }])

  if (target === 'cancel') {
    console.log(ansis.gray('  已取消设置'))
    return
  }

  const next = target === 'on'
  if (next === current) {
    console.log(ansis.gray(`  Lite 模式已是${current ? '开启' : '关闭'}状态，无需变更`))
    return
  }

  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: `确认设置为 ${next ? '开启' : '关闭'} Lite 模式并立即生效？`,
    default: true,
  }])

  if (!confirmed) {
    console.log(ansis.gray('  已取消设置'))
    return
  }

  console.log()
  console.log(ansis.yellow('  ⏳ 正在重渲染 prompts/skills/roles...'))

  const result = await installCxg({
    force: true,
    liteMode: next,
    mcpProvider: provider,
    skipBinary: true,
  })

  const nextConfig = createDefaultConfig({
    mcpProvider: provider,
    liteMode: next,
  })
  nextConfig.commands.installed = result.installedPrompts.length > 0
    ? result.installedPrompts
    : (config.commands?.installed || [])

  await writeCxgConfig(nextConfig)

  console.log()
  if (result.errors.length > 0) {
    console.log(ansis.yellow(`  ⚠ 已切换为 ${next ? '开启' : '关闭'}，但有以下警告:`))
    for (const error of result.errors) {
      console.log(`    ✗ ${error}`)
    }
  }
  else {
    console.log(ansis.green(`  ✓ Lite 模式已切换为: ${next ? '开启' : '关闭'}`))
  }
  console.log(ansis.gray('  提示: 重启 Codex CLI 使新模板生效'))
}
