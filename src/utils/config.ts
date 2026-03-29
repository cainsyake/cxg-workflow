import type { CxgConfig, McpProvider } from '../types'
import fs from 'fs-extra'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { parse, stringify } from 'smol-toml'
import { version as packageVersion } from '../../package.json'
import { isWindows } from './platform'
import { DEFAULT_MCP_PROVIDER } from './constants'

const CODEX_HOME = join(homedir(), '.codex')
const CXG_DIR = join(CODEX_HOME, '.cxg')
const CONFIG_FILE = join(CXG_DIR, 'config.toml')

export function getCodexHome(): string {
  return CODEX_HOME
}

export function getCxgDir(): string {
  return CXG_DIR
}

export function getConfigPath(): string {
  return CONFIG_FILE
}

export async function ensureCxgDir(): Promise<void> {
  await fs.ensureDir(CXG_DIR)
}

export async function readCxgConfig(): Promise<CxgConfig | null> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8')
      return parse(content) as unknown as CxgConfig
    }
  }
  catch {
    // Config doesn't exist or is invalid
  }
  return null
}

export async function writeCxgConfig(config: CxgConfig): Promise<void> {
  await ensureCxgDir()
  const tmpPath = `${CONFIG_FILE}.tmp`
  await fs.writeFile(tmpPath, stringify(config as any), 'utf-8')
  await fs.rename(tmpPath, CONFIG_FILE)
}

export function createDefaultConfig(options?: {
  mcpProvider?: McpProvider
  liteMode?: boolean
  binary?: {
    source?: string
    checksum_status?: 'verified' | 'missing' | 'failed' | 'skipped'
    verified_at?: string
    version?: string
  }
}): CxgConfig {
  return {
    general: {
      version: packageVersion,
      created_at: new Date().toISOString(),
    },
    runtime: {
      backend: 'codex',
      lite_mode: options?.liteMode ?? true,
    },
    paths: {
      skills: join(CODEX_HOME, 'skills', 'cxg'),
      roles: join(CXG_DIR, 'roles', 'codex'),
      wrapper: join(CODEX_HOME, 'bin', isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'),
    },
    commands: {
      installed: [],
    },
    binary: options?.binary,
    mcp: {
      provider: options?.mcpProvider || DEFAULT_MCP_PROVIDER,
    },
  }
}
