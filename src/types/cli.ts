import type { McpProvider } from './index'

export interface CliOptions {
  force?: boolean
  lite?: boolean
  mcp?: string
  skipMcp?: boolean
  yes?: boolean
  check?: boolean
}

export interface InitOptions extends CliOptions {
  mcpProvider?: McpProvider
  liteMode?: boolean
}

export interface UpdateCliOptions extends CliOptions {
  yes?: boolean
}

export interface VersionCliOptions extends CliOptions {
  check?: boolean
}
