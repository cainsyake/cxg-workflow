import fs from 'fs-extra'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { parse as parseToml } from 'smol-toml'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installAceTool, installAceToolRs } from '../mcp'

const ORIGINAL_HOME = process.env.HOME

async function readAceToolArgs(homePath: string): Promise<string[]> {
  const configPath = join(homePath, '.codex', 'config.toml')
  const content = await fs.readFile(configPath, 'utf-8')
  const parsed = parseToml(content) as Record<string, any>
  return (parsed.mcp_servers?.['ace-tool']?.args || []) as string[]
}

describe.sequential('MCP ace-tool config merge', () => {
  let tempHome = ''

  beforeEach(async () => {
    tempHome = await fs.mkdtemp(join(tmpdir(), 'cxg-workflow-mcp-'))
    process.env.HOME = tempHome
  })

  afterEach(async () => {
    process.env.HOME = ORIGINAL_HOME
    if (tempHome) {
      await fs.remove(tempHome)
    }
  })

  it('preserves existing --base-url and --token when installAceTool called without credentials', async () => {
    await installAceTool({
      baseUrl: 'https://relay.example.com/',
      token: 'ace_token_old',
    })

    await installAceTool({})

    const args = await readAceToolArgs(tempHome)
    expect(args).toEqual([
      '-y',
      'ace-tool@latest',
      '--base-url',
      'https://relay.example.com/',
      '--token',
      'ace_token_old',
    ])
  })

  it('preserves existing credentials when switching to ace-tool-rs', async () => {
    await installAceTool({
      baseUrl: 'https://relay.example.com/v2',
      token: 'ace_token_keep',
    })

    await installAceToolRs({})

    const args = await readAceToolArgs(tempHome)
    expect(args).toEqual([
      '-y',
      'ace-tool-rs@latest',
      '--base-url',
      'https://relay.example.com/v2',
      '--token',
      'ace_token_keep',
    ])
  })
})
