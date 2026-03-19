import type { AuxiliaryMcpDef } from '../types'
import ansis from 'ansis'
import inquirer from 'inquirer'
import fs from 'fs-extra'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { installAceTool, installAceToolRs, installContextWeaver, installMcpServer, uninstallMcpServer } from '../utils/mcp'

/**
 * Configure MCP tools (interactive menu)
 */
export async function configMcp(): Promise<void> {
  console.log()
  console.log(ansis.cyan.bold(`  配置 MCP 工具`))
  console.log()

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: '选择操作',
    choices: [
      { name: `${ansis.green('➜')} 代码检索 MCP ${ansis.gray('(ace-tool / ContextWeaver)')}`, value: 'code-retrieval' },
      { name: `${ansis.green('➜')} 联网搜索 MCP ${ansis.gray('(grok-search)')}`, value: 'grok-search' },
      { name: `${ansis.blue('➜')} 辅助工具 MCP ${ansis.gray('(context7 / Playwright / exa...)')}`, value: 'auxiliary' },
      { name: `${ansis.red('✕')} 卸载 MCP`, value: 'uninstall' },
      new inquirer.Separator(),
      { name: `${ansis.gray('← 返回')}`, value: 'cancel' },
    ],
  }])

  if (action === 'cancel') {
    return
  }

  if (action === 'code-retrieval') {
    await handleCodeRetrieval()
  }
  else if (action === 'grok-search') {
    await handleGrokSearch()
  }
  else if (action === 'auxiliary') {
    await handleAuxiliary()
  }
  else if (action === 'uninstall') {
    await handleUninstall()
  }
}

// ═══════════════════════════════════════════════════════
// Code Retrieval MCP
// ═══════════════════════════════════════════════════════

async function handleCodeRetrieval(): Promise<void> {
  console.log()

  const { tool } = await inquirer.prompt([{
    type: 'list',
    name: 'tool',
    message: '选择代码检索工具',
    choices: [
      { name: `ace-tool ${ansis.green('(推荐)')} ${ansis.gray('- 代码检索')}`, value: 'ace-tool' },
      { name: `ace-tool-rs ${ansis.green('(推荐)')} ${ansis.gray('- Rust 版本')}`, value: 'ace-tool-rs' },
      { name: `ContextWeaver ${ansis.gray('- 本地混合搜索（需硅基流动 API Key）')}`, value: 'contextweaver' },
      new inquirer.Separator(),
      { name: `${ansis.gray('← 返回')}`, value: 'cancel' },
    ],
  }])

  if (tool === 'cancel') {
    return
  }

  if (tool === 'contextweaver') {
    await handleInstallContextWeaver()
  }
  else {
    await handleInstallAceTool(tool === 'ace-tool-rs')
  }
}

async function handleInstallAceTool(isRs: boolean): Promise<void> {
  const toolName = isRs ? 'ace-tool-rs' : 'ace-tool'

  console.log()
  console.log(ansis.cyan(`📖 获取 ${toolName} 访问方式：`))
  console.log(`   ${ansis.gray('•')} ${ansis.cyan('官方服务')}: ${ansis.underline('https://augmentcode.com/')}`)
  console.log(`   ${ansis.gray('•')} ${ansis.cyan('第三方中转')} ${ansis.green('(推荐)')}: ${ansis.underline('https://acemcp.heroman.wtf/')}`)
  console.log()

  const answers = await inquirer.prompt([
    { type: 'input', name: 'baseUrl', message: `Base URL ${ansis.gray('(中转服务必填，官方留空)')}` },
    { type: 'password', name: 'token', message: `Token ${ansis.gray('(必填)')}`, validate: (v: string) => v.trim() !== '' || '请输入 Token' },
  ])

  console.log()
  console.log(ansis.yellow(`⏳ 正在配置 ${toolName} MCP...`))

  const result = await (isRs ? installAceToolRs : installAceTool)({
    baseUrl: answers.baseUrl?.trim() || undefined,
    token: answers.token.trim(),
  })

  console.log()
  if (result.success) {
    console.log(ansis.green(`✓ ${toolName} MCP 配置成功！`))
    console.log(ansis.gray(`  重启 Codex CLI 使配置生效`))
  }
  else {
    console.log(ansis.red(`✗ ${toolName} MCP 配置失败: ${result.message}`))
  }
}

async function handleInstallContextWeaver(): Promise<void> {
  console.log()
  console.log(ansis.cyan(`📖 获取硅基流动 API Key：`))
  console.log(`   ${ansis.gray('1.')} 访问 ${ansis.underline('https://siliconflow.cn/')} 注册账号`)
  console.log(`   ${ansis.gray('2.')} 进入控制台 → API 密钥 → 创建密钥`)
  console.log(`   ${ansis.gray('3.')} 新用户有免费额度，Embedding + Rerank 完全够用`)
  console.log()

  const { apiKey } = await inquirer.prompt([{
    type: 'password',
    name: 'apiKey',
    message: `硅基流动 API Key ${ansis.gray('(sk-xxx)')}`,
    mask: '*',
    validate: (v: string) => v.trim() !== '' || '请输入 API Key',
  }])

  console.log()
  console.log(ansis.yellow('⏳ 正在配置 ContextWeaver MCP...'))

  const result = await installContextWeaver({ siliconflowApiKey: apiKey.trim() })

  console.log()
  if (result.success) {
    console.log(ansis.green('✓ ContextWeaver MCP 配置成功！'))
    console.log(ansis.gray('  重启 Codex CLI 使配置生效'))
  }
  else {
    console.log(ansis.red(`✗ ContextWeaver MCP 配置失败: ${result.message}`))
  }
}

// ═══════════════════════════════════════════════════════
// Grok Search MCP
// ═══════════════════════════════════════════════════════

const GROK_SEARCH_PROMPT = `## Search and Evidence Standards

- Use the \`mcp__grok-search\` tool for web searches
- Execute independent search requests in parallel
- Key factual claims must be supported by >=2 independent sources
- Conflicting sources: Present evidence from both sides
- Citation format: [Author/Organization, Year/Date, URL]
`

async function writeGrokPromptToPrompts(): Promise<void> {
  const promptsDir = join(homedir(), '.codex', 'prompts')
  const promptPath = join(promptsDir, 'cxg-grok-search.md')
  await fs.ensureDir(promptsDir)
  await fs.writeFile(promptPath, GROK_SEARCH_PROMPT, 'utf-8')
}

async function handleGrokSearch(): Promise<void> {
  console.log()
  console.log(ansis.cyan.bold('  🔍 联网搜索 MCP (grok-search)'))
  console.log()

  console.log(ansis.cyan('  📖 获取 API Keys：'))
  console.log(`     Tavily: ${ansis.underline('https://www.tavily.com/')} ${ansis.gray('(免费额度 1000次/月)')}`)
  console.log(`     Firecrawl: ${ansis.underline('https://www.firecrawl.dev/')} ${ansis.gray('(注册即送额度)')}`)
  console.log(`     Grok API: ${ansis.gray('需自行部署 grok2api（可选）')}`)
  console.log()

  const answers = await inquirer.prompt([
    { type: 'input', name: 'grokApiUrl', message: `GROK_API_URL ${ansis.gray('(可选)')}`, default: '' },
    { type: 'password', name: 'grokApiKey', message: `GROK_API_KEY ${ansis.gray('(可选)')}`, mask: '*' },
    { type: 'password', name: 'tavilyKey', message: `TAVILY_API_KEY ${ansis.gray('(可选)')}`, mask: '*' },
    { type: 'password', name: 'firecrawlKey', message: `FIRECRAWL_API_KEY ${ansis.gray('(可选)')}`, mask: '*' },
  ])

  const env: Record<string, string> = {}
  if (answers.grokApiUrl?.trim()) {
    env.GROK_API_URL = answers.grokApiUrl.trim()
  }
  if (answers.grokApiKey?.trim()) {
    env.GROK_API_KEY = answers.grokApiKey.trim()
  }
  if (answers.tavilyKey?.trim()) {
    env.TAVILY_API_KEY = answers.tavilyKey.trim()
  }
  if (answers.firecrawlKey?.trim()) {
    env.FIRECRAWL_API_KEY = answers.firecrawlKey.trim()
  }

  if (Object.keys(env).length === 0) {
    console.log(ansis.yellow('  未填写任何 Key，已跳过'))
    return
  }

  console.log()
  console.log(ansis.yellow('⏳ 正在安装 grok-search MCP...'))

  const result = await installMcpServer(
    'grok-search',
    'uvx',
    ['--from', 'git+https://github.com/GuDaStudio/GrokSearch@grok-with-tavily', 'grok-search'],
    env,
  )

  console.log()
  if (result.success) {
    await writeGrokPromptToPrompts()
    console.log(ansis.green('✓ grok-search MCP 配置成功！'))
    console.log(ansis.green('✓ 搜索提示词已写入 ~/.codex/prompts/cxg-grok-search.md'))
    console.log(ansis.gray('  重启 Codex CLI 使配置生效'))
  }
  else {
    console.log(ansis.red(`✗ grok-search MCP 安装失败: ${result.message}`))
  }
}

// ═══════════════════════════════════════════════════════
// Auxiliary MCP Tools
// ═══════════════════════════════════════════════════════

const AUXILIARY_MCPS: AuxiliaryMcpDef[] = [
  { id: 'context7', name: 'Context7', desc: '获取最新库文档', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] },
  { id: 'Playwright', name: 'Playwright', desc: '浏览器自动化/测试', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
  { id: 'mcp-deepwiki', name: 'DeepWiki', desc: '知识库查询', command: 'npx', args: ['-y', 'mcp-deepwiki@latest'] },
  { id: 'exa', name: 'Exa', desc: '搜索引擎（需 API Key）', command: 'npx', args: ['-y', 'exa-mcp-server@latest'], requiresApiKey: true, apiKeyEnv: 'EXA_API_KEY' },
]

async function handleAuxiliary(): Promise<void> {
  console.log()

  const { selected } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selected',
    message: '选择要安装的辅助工具（空格选择，回车确认）',
    choices: AUXILIARY_MCPS.map(m => ({
      name: `${m.name} ${ansis.gray(`- ${m.desc}`)}`,
      value: m.id,
    })),
  }])

  if (!selected || selected.length === 0) {
    console.log(ansis.gray('未选择任何工具'))
    return
  }

  console.log()

  for (const id of selected) {
    const mcp = AUXILIARY_MCPS.find(m => m.id === id)!
    const env: Record<string, string> = {}

    if (mcp.requiresApiKey) {
      console.log(ansis.cyan(`📖 获取 ${mcp.name} API Key：`))
      console.log(`   访问 ${ansis.underline('https://exa.ai/')} 注册获取（有免费额度）`)
      console.log()

      const { apiKey } = await inquirer.prompt([{
        type: 'password',
        name: 'apiKey',
        message: `${mcp.name} API Key`,
        mask: '*',
        validate: (v: string) => v.trim() !== '' || '请输入 API Key',
      }])
      env[mcp.apiKeyEnv!] = apiKey.trim()
    }

    console.log(ansis.yellow(`⏳ 正在安装 ${mcp.name}...`))
    const result = await installMcpServer(mcp.id, mcp.command, mcp.args, env)

    if (result.success) {
      console.log(ansis.green(`✓ ${mcp.name} 安装成功`))
    }
    else {
      console.log(ansis.red(`✗ ${mcp.name} 安装失败: ${result.message}`))
    }
  }

  console.log()
  console.log(ansis.gray('重启 Codex CLI 使配置生效'))
}

// ═══════════════════════════════════════════════════════
// Uninstall MCP
// ═══════════════════════════════════════════════════════

async function handleUninstall(): Promise<void> {
  console.log()

  const allMcps = [
    { name: 'ace-tool', value: 'ace-tool' },
    { name: 'ContextWeaver', value: 'contextweaver' },
    { name: 'grok-search', value: 'grok-search' },
    ...AUXILIARY_MCPS.map(m => ({ name: m.name, value: m.id })),
  ]

  const { targets } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'targets',
    message: '选择要卸载的 MCP（空格选择，回车确认）',
    choices: allMcps,
  }])

  if (!targets || targets.length === 0) {
    console.log(ansis.gray('未选择任何工具'))
    return
  }

  console.log()

  for (const target of targets) {
    console.log(ansis.yellow(`⏳ 正在卸载 ${target}...`))
    const result = await uninstallMcpServer(target)

    if (result.success) {
      console.log(ansis.green(`✓ ${target} 已卸载`))
    }
    else {
      console.log(ansis.red(`✗ ${target} 卸载失败: ${result.message}`))
    }
  }

  console.log()
}
