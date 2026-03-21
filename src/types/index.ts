export type SupportedLang = 'zh-CN' | 'en'
export type McpProvider = 'skip' | 'ace-tool' | 'contextweaver'

export interface CxgConfig {
  general: {
    version: string
    created_at: string
  }
  runtime: {
    backend: 'codex'
    lite_mode: boolean
  }
  paths: {
    prompts: string
    skills: string
    roles: string
    wrapper: string
  }
  commands: {
    installed: string[]
  }
  binary?: {
    source?: string
    checksum_status?: 'verified' | 'missing' | 'failed' | 'skipped'
    verified_at?: string
    version?: string
  }
  mcp?: {
    provider: McpProvider
  }
}

export interface InstallResult {
  success: boolean
  installedPrompts: string[]
  installedSkills: string[]
  installedRoles: string[]
  errors: string[]
  binInstalled?: boolean
  binPath?: string
  binSource?: string
  binChecksumStatus?: 'verified' | 'missing' | 'failed' | 'skipped'
  binVersion?: string
}

export interface UninstallResult {
  success: boolean
  removedPrompts: string[]
  removedSkills: string[]
  removedRoles: string[]
  removedBin: boolean
  errors: string[]
}

export interface WorkflowConfig {
  id: string
  name: string
  nameEn: string
  category: 'core' | 'development' | 'quality' | 'delivery' | 'bootstrap'
  description: string
  descriptionEn: string
  order: number
}

export interface AceToolConfig {
  baseUrl?: string
  token?: string
}

export interface ContextWeaverConfig {
  siliconflowApiKey: string
}

export interface AuxiliaryMcpDef {
  id: string
  name: string
  desc: string
  command: string
  args: string[]
  requiresApiKey?: boolean
  apiKeyEnv?: string
}
