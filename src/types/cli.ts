import type { McpProvider } from './index'

export interface CliOptions {
  force?: boolean
  lite?: boolean
  mcp?: string
  skipMcp?: boolean
}

export interface InitOptions extends CliOptions {
  mcpProvider?: McpProvider
  liteMode?: boolean
}
