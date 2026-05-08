export type SupportedLang = 'zh-CN' | 'en'
export type McpProvider = 'skip' | 'ace-tool' | 'contextweaver'

export interface CxgPaths {
  skills: string
  roles: string
  agents: string
  wrapper: string
}

export interface LegacyCxgPaths extends CxgPaths {
  prompts?: string
}

export interface CxgSkillsConfig {
  installed: string[]
}

export interface LegacyCxgCommandsConfig {
  installed?: string[]
}

export interface CxgConfig {
  general: {
    version: string
    created_at: string
  }
  runtime: {
    backend: 'codex'
    lite_mode: boolean
  }
  paths: CxgPaths
  skills: CxgSkillsConfig
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

export interface RawCxgConfig extends Omit<CxgConfig, 'paths' | 'skills'> {
  paths: LegacyCxgPaths
  skills?: CxgSkillsConfig
  commands?: LegacyCxgCommandsConfig
}

export interface InstallResult {
  success: boolean
  installedSkills: string[]
  installedRoles: string[]
  installedAgents: string[]
  errors: string[]
  binInstalled?: boolean
  binPath?: string
  binSource?: string
  binChecksumStatus?: 'verified' | 'missing' | 'failed' | 'skipped'
  binVersion?: string
}

export interface UninstallResult {
  success: boolean
  removedSkills: string[]
  removedRoles: string[]
  removedAgents: string[]
  removedBin: boolean
  errors: string[]
  legacyPromptsDetected?: string[]
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
