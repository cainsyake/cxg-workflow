import type { McpProvider, WorkflowConfig } from '../types'

export const DEFAULT_MCP_PROVIDER: McpProvider = 'ace-tool'

export const ALL_COMMANDS = [
  'cxg-workflow',
  'cxg-plan',
  'cxg-execute',
  'cxg-feat',
  'cxg-analyze',
  'cxg-debug',
  'cxg-optimize',
  'cxg-test',
  'cxg-review',
  'cxg-enhance',
  'cxg-commit',
  'cxg-init',
] as const

export type CxgCommandId = typeof ALL_COMMANDS[number]

export const WORKFLOW_CONFIGS: WorkflowConfig[] = [
  { id: 'cxg-workflow', name: '主工作流', nameEn: 'Main Workflow', category: 'core', description: '5阶段单模型开发主流程（研究→计划→执行→优化→评审）', descriptionEn: '5-phase single-model workflow', order: 1 },
  { id: 'cxg-plan', name: '规划', nameEn: 'Plan', category: 'core', description: '生成实施计划', descriptionEn: 'Generate implementation plan', order: 2 },
  { id: 'cxg-execute', name: '执行', nameEn: 'Execute', category: 'core', description: '根据计划执行实现', descriptionEn: 'Execute from approved plan', order: 3 },
  { id: 'cxg-feat', name: '功能开发', nameEn: 'Feature', category: 'development', description: '智能功能开发', descriptionEn: 'Smart feature development', order: 4 },
  { id: 'cxg-analyze', name: '技术分析', nameEn: 'Analyze', category: 'development', description: '只分析不改动代码', descriptionEn: 'Analysis without code changes', order: 5 },
  { id: 'cxg-debug', name: '调试修复', nameEn: 'Debug', category: 'development', description: '问题定位与修复', descriptionEn: 'Debug and fix', order: 6 },
  { id: 'cxg-optimize', name: '性能优化', nameEn: 'Optimize', category: 'development', description: '性能与资源优化', descriptionEn: 'Performance optimization', order: 7 },
  { id: 'cxg-test', name: '测试生成', nameEn: 'Test', category: 'quality', description: '测试设计与生成', descriptionEn: 'Test generation', order: 8 },
  { id: 'cxg-review', name: '代码审查', nameEn: 'Review', category: 'quality', description: '质量与安全审查', descriptionEn: 'Code quality review', order: 9 },
  { id: 'cxg-enhance', name: 'Prompt 增强', nameEn: 'Enhance', category: 'quality', description: '需求结构化增强', descriptionEn: 'Prompt enhancement', order: 10 },
  { id: 'cxg-commit', name: '提交信息', nameEn: 'Commit', category: 'delivery', description: 'Conventional Commit 生成', descriptionEn: 'Commit message generation', order: 11 },
  { id: 'cxg-init', name: '上下文初始化', nameEn: 'Init Context', category: 'bootstrap', description: '初始化 AGENTS.md', descriptionEn: 'Initialize AGENTS.md context', order: 12 },
]

// GitHub Release download config (shared with ccg-workflow)
export const GITHUB_REPO = 'fengshao1227/ccg-workflow'
export const RELEASE_TAG = 'preset'
export const BINARY_DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}`
