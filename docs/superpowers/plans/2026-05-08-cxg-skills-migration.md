# CXG Skills-Native Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate CXG from `/cxg-*` custom prompts to top-level `$cxg-*` skills while keeping the 12 workflow entry points, installer lifecycle, config compatibility, tests, and docs consistent.

**Architecture:** The package will keep `templates/prompts/` in-repo as reference-only source material, but all shipped and managed runtime entry points will become top-level skill directories under `templates/skills/`. Runtime code will treat skills as the only managed user entry mechanism, while config readers keep backward compatibility by accepting legacy `commands.installed` and `paths.prompts` during reads and writing only the new `skills.installed` schema. Lifecycle commands, doctor checks, package publishing, and docs will all describe and validate the same skills-native model.

**Tech Stack:** TypeScript, Node.js ESM, `fs-extra`, `pathe`, Vitest, ESLint, Markdown templates

---

## File Structure

### Runtime and packaging

- Modify: `package.json`
- Modify: `src/utils/installer.ts`
- Modify: `src/utils/config.ts`
- Modify: `src/types/index.ts`
- Modify: `src/utils/constants.ts`
- Modify: `src/commands/init.ts`
- Modify: `src/commands/update.ts`
- Modify: `src/commands/uninstall.ts`
- Modify: `src/commands/menu.ts`
- Modify: `src/commands/doctor.ts`
- Modify: `src/commands/config-mcp.ts`

### Templates and shipped assets

- Modify: `templates/skills/SKILL.md`
- Create: `templates/skills/shared/workflow-rules.md`
- Create: `templates/skills/shared/interaction-checkpoints.md`
- Create: `templates/skills/shared/output-contracts.md`
- Create: `templates/skills/cxg-workflow/SKILL.md`
- Create: `templates/skills/cxg-plan/SKILL.md`
- Create: `templates/skills/cxg-execute/SKILL.md`
- Create: `templates/skills/cxg-feat/SKILL.md`
- Create: `templates/skills/cxg-analyze/SKILL.md`
- Create: `templates/skills/cxg-debug/SKILL.md`
- Create: `templates/skills/cxg-optimize/SKILL.md`
- Create: `templates/skills/cxg-test/SKILL.md`
- Create: `templates/skills/cxg-review/SKILL.md`
- Create: `templates/skills/cxg-enhance/SKILL.md`
- Create: `templates/skills/cxg-commit/SKILL.md`
- Create: `templates/skills/cxg-init/SKILL.md`

### Tests

- Modify: `src/utils/__tests__/installer.test.ts`
- Modify: `src/utils/__tests__/config.test.ts`
- Modify: `src/utils/__tests__/template.test.ts`
- Create: `src/commands/__tests__/doctor.test.ts`

### Documentation

- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `templates/roles/codex/analyzer.md`
- Modify: `templates/roles/codex/analyzer-frontend.md`
- Modify: `templates/roles/codex/architect.md`
- Modify: `templates/roles/codex/architect-frontend.md`
- Modify: `templates/roles/codex/debugger.md`
- Modify: `templates/roles/codex/debugger-frontend.md`
- Modify: `templates/roles/codex/frontend.md`
- Modify: `templates/roles/codex/optimizer.md`
- Modify: `templates/roles/codex/optimizer-frontend.md`
- Modify: `templates/roles/codex/reviewer.md`
- Modify: `templates/roles/codex/reviewer-frontend.md`
- Modify: `templates/roles/codex/tester.md`
- Modify: `templates/roles/codex/tester-frontend.md`

### Decomposition notes

- Keep `templates/prompts/` untouched as migration reference material, but stop shipping or installing it.
- Keep `ALL_COMMANDS` as the canonical 12 workflow IDs to avoid needless churn; treat them as skill IDs at runtime.
- Add a small config normalization layer instead of scattering `skills.installed ?? commands.installed` fallbacks across commands.
- Pull doctor logic into a testable helper inside `src/commands/doctor.ts` or a neighboring file if the extraction keeps the command wrapper small.
- `src/commands/config-mcp.ts` currently writes `~/.codex/prompts/cxg-grok-search.md`; this conflicts with the new “skills-only managed runtime” story, so migrate that helper artifact out of `prompts/`.

### Task 1: Restructure Shipped Skill Templates

**Files:**
- Create: `templates/skills/shared/workflow-rules.md`
- Create: `templates/skills/shared/interaction-checkpoints.md`
- Create: `templates/skills/shared/output-contracts.md`
- Create: `templates/skills/cxg-workflow/SKILL.md`
- Create: `templates/skills/cxg-plan/SKILL.md`
- Create: `templates/skills/cxg-execute/SKILL.md`
- Create: `templates/skills/cxg-feat/SKILL.md`
- Create: `templates/skills/cxg-analyze/SKILL.md`
- Create: `templates/skills/cxg-debug/SKILL.md`
- Create: `templates/skills/cxg-optimize/SKILL.md`
- Create: `templates/skills/cxg-test/SKILL.md`
- Create: `templates/skills/cxg-review/SKILL.md`
- Create: `templates/skills/cxg-enhance/SKILL.md`
- Create: `templates/skills/cxg-commit/SKILL.md`
- Create: `templates/skills/cxg-init/SKILL.md`
- Modify: `templates/skills/SKILL.md`
- Test: `src/utils/__tests__/installer.test.ts`

- [ ] **Step 1: Write the failing asset-layout test**

```ts
const REQUIRED_TOP_LEVEL_SKILLS = ALL_COMMANDS.map(cmd =>
  join(SKILLS_DIR, cmd, 'SKILL.md'),
)

it('every workflow id has a top-level skill directory', () => {
  for (const requiredFile of REQUIRED_TOP_LEVEL_SKILLS) {
    expect(
      existsSync(requiredFile),
      `top-level skill missing: ${requiredFile.replace(`${PACKAGE_ROOT}/`, '')}`,
    ).toBe(true)
  }
})

it('shared skill assets exist', () => {
  for (const sharedFile of [
    join(SKILLS_DIR, 'shared', 'workflow-rules.md'),
    join(SKILLS_DIR, 'shared', 'interaction-checkpoints.md'),
    join(SKILLS_DIR, 'shared', 'output-contracts.md'),
  ]) {
    expect(
      existsSync(sharedFile),
      `shared skill asset missing: ${sharedFile.replace(`${PACKAGE_ROOT}/`, '')}`,
    ).toBe(true)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`
Expected: FAIL with missing `templates/skills/cxg-*/SKILL.md` and missing `templates/skills/shared/*.md`

- [ ] **Step 3: Create the shared assets and 12 top-level skill entrypoints**

```md
---
name: cxg-plan
description: Generate an implementation plan for a scoped engineering task through the CXG planning workflow.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# CXG Plan

Use this skill when the user explicitly wants a plan before implementation, or when the task is large enough that a written implementation plan is the right next deliverable.

## Expected Input

- A task description, bug report, or refactor target
- Constraints such as timeline, language, repo area, or rollout risk

## Workflow

1. Read `../shared/workflow-rules.md` and follow the CXG phase rules.
2. Read `../shared/interaction-checkpoints.md` before escalating or asking for confirmation.
3. Produce a written implementation plan with concrete files, tests, and verification commands.
4. Format the final deliverable using `../shared/output-contracts.md`.

## Deliverable

- A plan file path when the task requires saved output
- A concise implementation plan with test-first steps and verification commands
```

```md
---
name: cxg-workflow
description: Run the full CXG workflow from analysis through review using top-level skills-native entrypoints.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# CXG Workflow

Use this skill for multi-step engineering tasks that should explicitly move through analysis, planning, execution, optimization, and review.

## Expected Input

- A concrete task or feature request
- Constraints, risks, and any repo-specific context already known

## Workflow

1. Follow `../shared/workflow-rules.md`.
2. Use `../shared/interaction-checkpoints.md` for approval gates.
3. Delegate to `cxg-analyze`, `cxg-plan`, `cxg-execute`, `cxg-optimize`, and `cxg-review` behavior as needed.
4. Return outcomes in the format described by `../shared/output-contracts.md`.
```

```md
---
name: cxg-skills
description: CXG skills overview for installed workflow, shared assets, tools, and orchestration helpers.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# CXG Skills

## Structure

```text
skills/
├── cxg-workflow/
├── cxg-plan/
├── cxg-execute/
├── cxg-feat/
├── cxg-analyze/
├── cxg-debug/
├── cxg-optimize/
├── cxg-test/
├── cxg-review/
├── cxg-enhance/
├── cxg-commit/
├── cxg-init/
├── shared/
├── tools/
├── orchestration/
└── run_skill.js
```

Top-level `cxg-*` directories are the user-facing entrypoints. `shared/`, `tools/`, and `orchestration/` provide internal support assets.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`
Expected: PASS for the new top-level skill and shared-asset checks

- [ ] **Step 5: Commit**

```bash
git add src/utils/__tests__/installer.test.ts templates/skills
git commit -m "feat: add top-level cxg skill templates"
```

### Task 2: Switch Packaging And Installer To Skills-Only Runtime Assets

**Files:**
- Modify: `package.json`
- Modify: `src/types/index.ts`
- Modify: `src/utils/installer.ts`
- Test: `src/utils/__tests__/installer.test.ts`

- [ ] **Step 1: Write the failing installer and package manifest tests**

```ts
it('package publish list excludes prompt templates', () => {
  const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf-8'))
  expect(pkg.files).toContain('templates/skills/')
  expect(pkg.files).not.toContain('templates/prompts/')
})

it('does not require custom prompt templates for install completeness', () => {
  expect(REQUIRED_SKILL_FILES).toContain(join(SKILLS_DIR, 'cxg-workflow', 'SKILL.md'))
  for (const cmd of ALL_COMMANDS) {
    const promptPath = join(PROMPTS_DIR, `${cmd}.md`)
    expect(
      existsSync(promptPath),
      `legacy prompt reference material missing: templates/prompts/${cmd}.md`,
    ).toBe(true)
  }
})
```

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`
Expected: FAIL because `package.json` still ships `templates/prompts/` and installer-facing types still expose prompt installation/removal results

- [ ] **Step 3: Implement the package and installer migration**

```json
{
  "files": [
    "bin/cxg.mjs",
    "dist",
    "templates/commands/",
    "templates/roles/",
    "templates/skills/"
  ]
}
```

```ts
const REQUIRED_TOP_LEVEL_SKILL_FILES = ALL_COMMANDS.map(cmd =>
  join(skillsDir, cmd, 'SKILL.md'),
)

async function postflightCheck(
  codexHome: string,
  skipBinary: boolean,
  result: InstallResult,
): Promise<string[]> {
  const errors: string[] = []
  const skillsDir = join(codexHome, 'skills', 'cxg')
  const missingTopLevelSkills: string[] = []

  for (const file of REQUIRED_TOP_LEVEL_SKILL_FILES) {
    if (!(await fs.pathExists(file))) {
      missingTopLevelSkills.push(file.replace(`${skillsDir}/`, ''))
    }
  }

  if (missingTopLevelSkills.length > 0) {
    errors.push(`Missing top-level skill files after install: ${missingTopLevelSkills.join(', ')}`)
  }

  if (!skipBinary && !result.binInstalled) {
    errors.push('Binary postflight check failed: codeagent-wrapper is unavailable')
  }

  return errors
}

export async function installCxg(options: {
  force?: boolean
  liteMode?: boolean
  mcpProvider?: McpProvider
  skipBinary?: boolean
} = {}): Promise<InstallResult> {
  const result: InstallResult = {
    success: true,
    installedSkills: [],
    installedRoles: [],
    installedAgents: [],
    errors: [],
  }

  await fs.ensureDir(skillsDir)
  await fs.ensureDir(rolesDir)
  await fs.ensureDir(agentsDir)
  await fs.ensureDir(binDir)

  const skillsTemplateDir = join(templateDir, 'skills')
  await fs.copy(skillsTemplateDir, skillsDir, {
    overwrite: force,
    errorOnExist: false,
  })
  await replacePathsInMarkdownFiles(skillsDir, codexHome, installConfig)
  result.installedSkills = await collectInstalledSkills(skillsDir)

  return result
}

export async function uninstallCxg(options?: { preserveBinary?: boolean }): Promise<UninstallResult> {
  const promptsDir = join(codexHome, 'prompts')
  const legacyPromptsDetected = await fs.pathExists(promptsDir)
    ? (await fs.readdir(promptsDir)).filter(file => file.startsWith('cxg-') && file.endsWith('.md'))
    : []

  const result: UninstallResult = {
    success: true,
    removedSkills: [],
    removedRoles: [],
    removedAgents: [],
    removedBin: false,
    errors: [],
    legacyPromptsDetected,
  }

  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`
Expected: PASS with package publish list updated and installer completeness checks no longer centered on prompt installation

- [ ] **Step 5: Commit**

```bash
git add package.json src/types/index.ts src/utils/installer.ts src/utils/__tests__/installer.test.ts
git commit -m "refactor: install cxg runtime as skills only"
```

### Task 3: Normalize Config Schema And Legacy Compatibility

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/config.ts`
- Modify: `src/utils/constants.ts`
- Modify: `src/utils/__tests__/config.test.ts`

- [ ] **Step 1: Write the failing config tests**

```ts
import { createDefaultConfig, normalizeCxgConfig } from '../config'

it('default config omits paths.prompts and initializes skills.installed', () => {
  const config = createDefaultConfig()
  expect('prompts' in config.paths).toBe(false)
  expect(config.skills.installed).toEqual([])
})

it('normalizeCxgConfig upgrades legacy commands.installed on read', () => {
  const normalized = normalizeCxgConfig({
    general: { version: '0.1.14', created_at: '2026-05-08T00:00:00.000Z' },
    runtime: { backend: 'codex', lite_mode: true },
    paths: {
      prompts: '/home/test/.codex/prompts',
      skills: '/home/test/.codex/skills/cxg',
      roles: '/home/test/.codex/.cxg/roles/codex',
      agents: '/home/test/.codex/.cxg/agents/codex',
      wrapper: '/home/test/.codex/bin/codeagent-wrapper',
    },
    commands: { installed: ['cxg-plan', 'cxg-review'] },
    mcp: { provider: 'ace-tool' },
  } as any)

  expect(normalized.skills.installed).toEqual(['cxg-plan', 'cxg-review'])
  expect('commands' in normalized).toBe(false)
  expect('prompts' in normalized.paths).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/__tests__/config.test.ts`
Expected: FAIL because the default config still writes `paths.prompts` and `commands.installed`, and there is no normalization helper yet

- [ ] **Step 3: Implement the new schema and compatibility helpers**

```ts
export interface LegacyCxgConfig {
  general: {
    version: string
    created_at: string
  }
  runtime: {
    backend: 'codex'
    lite_mode: boolean
  }
  paths: {
    prompts?: string
    skills: string
    roles: string
    agents: string
    wrapper: string
  }
  commands?: {
    installed: string[]
  }
  skills?: {
    installed: string[]
  }
  binary?: CxgConfig['binary']
  mcp?: {
    provider: McpProvider
  }
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
  paths: {
    skills: string
    roles: string
    agents: string
    wrapper: string
  }
  skills: {
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
```

```ts
export function normalizeCxgConfig(raw: LegacyCxgConfig): CxgConfig {
  return {
    general: raw.general,
    runtime: raw.runtime,
    paths: {
      skills: raw.paths.skills,
      roles: raw.paths.roles,
      agents: raw.paths.agents,
      wrapper: raw.paths.wrapper,
    },
    skills: {
      installed: raw.skills?.installed ?? raw.commands?.installed ?? [],
    },
    binary: raw.binary,
    mcp: raw.mcp,
  }
}

export async function readCxgConfig(): Promise<CxgConfig | null> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8')
      return normalizeCxgConfig(parse(content) as LegacyCxgConfig)
    }
  }
  catch {
    // Config doesn't exist or is invalid
  }
  return null
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
      agents: join(CXG_DIR, 'agents', 'codex'),
      wrapper: join(CODEX_HOME, 'bin', isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'),
    },
    skills: {
      installed: [],
    },
    binary: options?.binary,
    mcp: {
      provider: options?.mcpProvider || DEFAULT_MCP_PROVIDER,
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/__tests__/config.test.ts`
Expected: PASS with new-schema defaults and legacy read compatibility

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/utils/config.ts src/utils/constants.ts src/utils/__tests__/config.test.ts
git commit -m "refactor: migrate cxg config to skills schema"
```

### Task 4: Update Lifecycle Commands And Doctor Semantics

**Files:**
- Modify: `src/commands/init.ts`
- Modify: `src/commands/update.ts`
- Modify: `src/commands/uninstall.ts`
- Modify: `src/commands/menu.ts`
- Modify: `src/commands/doctor.ts`
- Create: `src/commands/__tests__/doctor.test.ts`

- [ ] **Step 1: Write the failing doctor behavior tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildDoctorDiagnostics } from '../doctor'

describe('buildDoctorDiagnostics', () => {
  it('fails when a top-level workflow skill is missing', async () => {
    const diagnostics = await buildDoctorDiagnostics({
      codexHome: '/tmp/codex-home',
      config: {
        general: { version: '0.1.14', created_at: '2026-05-08T00:00:00.000Z' },
        runtime: { backend: 'codex', lite_mode: true },
        paths: {
          skills: '/tmp/codex-home/skills/cxg',
          roles: '/tmp/codex-home/.cxg/roles/codex',
          agents: '/tmp/codex-home/.cxg/agents/codex',
          wrapper: '/tmp/codex-home/bin/codeagent-wrapper',
        },
        skills: { installed: ['cxg-plan'] },
        mcp: { provider: 'skip' },
      },
      exists: async file => file.endsWith('cxg-plan/SKILL.md'),
    })

    const skillsLine = diagnostics.find(item => item.label.startsWith('Top-level skills'))
    expect(skillsLine?.ok).toBe(false)
  })

  it('surfaces legacy prompts as warning-only metadata', async () => {
    const diagnostics = await buildDoctorDiagnostics({
      codexHome: '/tmp/codex-home',
      config: null,
      exists: async () => true,
      readDir: async dir => dir.endsWith('/prompts') ? ['cxg-plan.md'] : [],
    })

    const legacyLine = diagnostics.find(item => item.label.includes('Legacy prompts'))
    expect(legacyLine?.ok).toBe(true)
    expect(legacyLine?.detail).toContain('warning')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/commands/__tests__/doctor.test.ts`
Expected: FAIL because `buildDoctorDiagnostics` does not exist and doctor still treats prompts as required assets

- [ ] **Step 3: Implement skills-native lifecycle behavior**

```ts
export async function init(options: InitOptions = {}): Promise<void> {
  const result = await installCxg({ force, liteMode, mcpProvider })

  if (result.installedSkills.length > 0) {
    console.log(`    ✓ Top-level skills + support assets: ${result.installedSkills.length} 个定义`)
  }

  const installedSkills = result.success
    ? [...ALL_COMMANDS]
    : result.installedSkills.filter(id => ALL_COMMANDS.includes(id as any))

  const config = createDefaultConfig({
    mcpProvider,
    liteMode,
    binary: {
      source: result.binSource,
      checksum_status: result.binChecksumStatus,
      verified_at: result.binInstalled ? new Date().toISOString() : undefined,
      version: result.binVersion,
    },
  })
  config.skills.installed = installedSkills
  await writeCxgConfig(config)

  console.log('  使用方法: 在 Codex 中输入 $cxg-plan / $cxg-workflow / $cxg-review 等 skills 名称调用')
}
```

```ts
async function performAtomicUpdate(
  fromVersion: string,
  toVersion: string,
  options: { installLatest: boolean },
): Promise<void> {
  await moveIfExists(join(codexHome, 'skills', 'cxg'), join(backupRoot, 'skills', 'cxg'), records)
  await moveIfExists(join(codexHome, '.cxg'), join(backupRoot, '.cxg'), records)
  await moveIfExists(getWrapperPath(codexHome), join(backupRoot, 'bin', isWindows() ? 'codeagent-wrapper.exe' : 'codeagent-wrapper'), records)
}
```

```ts
export async function uninstall(): Promise<void> {
  const result = await uninstallCxg()

  if (result.legacyPromptsDetected?.length) {
    console.log(`  ⚠ 检测到 legacy prompt 文件，未删除: ${result.legacyPromptsDetected.join(', ')}`)
  }
}
```

```ts
export async function buildDoctorDiagnostics(deps?: {
  codexHome?: string
  config?: CxgConfig | null
  exists?: (path: string) => Promise<boolean>
  readDir?: (path: string) => Promise<string[]>
}): Promise<DiagnosticResult[]> {
  const exists = deps?.exists ?? (path => fs.pathExists(path))
  const readDir = deps?.readDir ?? (path => fs.readdir(path).catch(() => [] as string[]))
  const codexHome = deps?.codexHome ?? join(homedir(), '.codex')
  const config = deps?.config ?? await readCxgConfig()

  const topLevelSkills = ALL_COMMANDS.map(cmd => join(codexHome, 'skills', 'cxg', cmd, 'SKILL.md'))
  const missingTopLevelSkills = []
  for (const file of topLevelSkills) {
    if (!(await exists(file))) {
      missingTopLevelSkills.push(file.replace(`${codexHome}/`, ''))
    }
  }

  const legacyPromptFiles = (await readDir(join(codexHome, 'prompts')))
    .filter(file => file.startsWith('cxg-') && file.endsWith('.md'))

  return [
    {
      label: `Top-level skills (${ALL_COMMANDS.length - missingTopLevelSkills.length}/${ALL_COMMANDS.length})`,
      ok: missingTopLevelSkills.length === 0,
      detail: missingTopLevelSkills.length > 0 ? `缺失: ${missingTopLevelSkills.join(', ')}` : undefined,
    },
    {
      label: `Legacy prompts (${legacyPromptFiles.length})`,
      ok: true,
      detail: legacyPromptFiles.length > 0 ? `warning: legacy artifacts not managed anymore` : 'none',
    },
  ]
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/commands/__tests__/doctor.test.ts src/utils/__tests__/config.test.ts`
Expected: PASS with doctor evaluating top-level skills and treating legacy prompts as informational only

- [ ] **Step 5: Commit**

```bash
git add src/commands/init.ts src/commands/update.ts src/commands/uninstall.ts src/commands/menu.ts src/commands/doctor.ts src/commands/__tests__/doctor.test.ts
git commit -m "refactor: update cxg lifecycle commands for skills runtime"
```

### Task 5: Remove Prompt-Centric Auxiliary Behavior And Update Installed Messaging

**Files:**
- Modify: `src/commands/config-mcp.ts`
- Modify: `src/utils/__tests__/template.test.ts`
- Modify: `src/utils/__tests__/installer.test.ts`

- [ ] **Step 1: Write the failing consistency tests**

```ts
it('shipping templates do not advertise slash-command entrypoints', () => {
  const topLevelSkillDocs = ALL_COMMANDS.map(cmd => join(SKILLS_DIR, cmd, 'SKILL.md'))
  for (const file of topLevelSkillDocs) {
    const content = readFileSync(file, 'utf-8')
    expect(content.includes('/cxg-')).toBe(false)
    expect(content.includes('$cxg-')).toBe(true)
  }
})

it('no runtime helper writes cxg prompt files into ~/.codex/prompts', () => {
  const configMcpSource = readFileSync(join(PACKAGE_ROOT, 'src', 'commands', 'config-mcp.ts'), 'utf-8')
  expect(configMcpSource.includes("join(homedir(), '.codex', 'prompts')")).toBe(false)
  expect(configMcpSource.includes('cxg-grok-search.md')).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts src/utils/__tests__/template.test.ts`
Expected: FAIL because current top-level skills do not exist yet or still contain prompt-era wording, and `config-mcp.ts` still writes `cxg-grok-search.md` into `~/.codex/prompts`

- [ ] **Step 3: Move the grok-search helper out of prompts and update wording**

```ts
async function writeGrokSkillGuidance(): Promise<string> {
  const guidanceDir = join(homedir(), '.codex', '.cxg')
  const guidancePath = join(guidanceDir, 'grok-search-guidance.md')
  await fs.ensureDir(guidanceDir)
  await fs.writeFile(guidancePath, GROK_SEARCH_PROMPT, 'utf-8')
  return guidancePath
}

async function handleGrokSearch(): Promise<void> {
  const result = await installMcpServer(
    'grok-search',
    'uvx',
    ['--from', 'git+https://github.com/GuDaStudio/GrokSearch@grok-with-tavily', 'grok-search'],
    env,
  )

  if (result.success) {
    const guidancePath = await writeGrokSkillGuidance()
    console.log(ansis.green('✓ grok-search MCP 配置成功！'))
    console.log(ansis.green(`✓ 搜索说明已写入 ${guidancePath}`))
    console.log(ansis.gray('  该说明仅为参考，不会安装为 custom prompt'))
  }
}
```

```md
## Workflow

1. Follow `../shared/workflow-rules.md`.
2. Use `../shared/interaction-checkpoints.md` for approval gates.
3. Return the result in the format described by `../shared/output-contracts.md`.

## Invocation

- Explicit skill call: `$cxg-review`
- Explicit skill call with task: `$cxg-debug reproduce the failing cache invalidation path`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts src/utils/__tests__/template.test.ts`
Expected: PASS with shipped skill docs using `$cxg-*` wording and `config-mcp.ts` no longer emitting CXG prompt files

- [ ] **Step 5: Commit**

```bash
git add src/commands/config-mcp.ts src/utils/__tests__/installer.test.ts src/utils/__tests__/template.test.ts templates/skills
git commit -m "refactor: remove prompt-centric helper artifacts"
```

### Task 6: Rewrite README And Role Docs For Skills-Native UX

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `templates/roles/codex/analyzer.md`
- Modify: `templates/roles/codex/analyzer-frontend.md`
- Modify: `templates/roles/codex/architect.md`
- Modify: `templates/roles/codex/architect-frontend.md`
- Modify: `templates/roles/codex/debugger.md`
- Modify: `templates/roles/codex/debugger-frontend.md`
- Modify: `templates/roles/codex/frontend.md`
- Modify: `templates/roles/codex/optimizer.md`
- Modify: `templates/roles/codex/optimizer-frontend.md`
- Modify: `templates/roles/codex/reviewer.md`
- Modify: `templates/roles/codex/reviewer-frontend.md`
- Modify: `templates/roles/codex/tester.md`
- Modify: `templates/roles/codex/tester-frontend.md`

- [ ] **Step 1: Write the failing documentation guard tests**

```ts
it('README uses skill-native examples instead of slash commands', () => {
  const readmeEn = readFileSync(join(PACKAGE_ROOT, 'README.md'), 'utf-8')
  const readmeZh = readFileSync(join(PACKAGE_ROOT, 'README.zh-CN.md'), 'utf-8')

  for (const content of [readmeEn, readmeZh]) {
    expect(content.includes('/cxg-workflow')).toBe(false)
    expect(content.includes('/cxg-plan')).toBe(false)
    expect(content.includes('$cxg-workflow')).toBe(true)
    expect(content.includes('$cxg-plan')).toBe(true)
    expect(content.includes('~/.codex/prompts/')).toBe(false)
  }
})
```

```ts
it('role templates no longer describe prompt-era entrypoints', () => {
  for (const roleFile of collectMarkdownFiles(ROLES_DIR)) {
    const content = readFileSync(roleFile, 'utf-8')
    expect(content.includes('For: /prompts:cxg-')).toBe(false)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`
Expected: FAIL because both README files and multiple role templates still reference `/cxg-*` or `/prompts:cxg-*`

- [ ] **Step 3: Rewrite docs and role headers**

```md
CXG is a Codex-first workflow package for Codex. It installs top-level skills, supporting roles, agent templates, and a `codeagent-wrapper` binary so Codex can handle research, planning, execution, optimization, and review in a consistent single-model workflow.

After installation, invoke skills explicitly:

```text
$cxg-workflow implement user authentication
$cxg-plan refactor payment service
$cxg-review
```
```

```md
> For: $cxg-plan, $cxg-workflow planning phase, $cxg-feat architecture tasks
```

```md
```text
~/.codex/
├── skills/
│   └── cxg/
│       ├── cxg-workflow/
│       ├── cxg-plan/
│       ├── cxg-execute/
│       ├── shared/
│       ├── tools/
│       ├── orchestration/
│       └── run_skill.js
├── bin/
│   └── codeagent-wrapper
└── .cxg/
    ├── config.toml
    ├── agents/
    └── roles/
```
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`
Expected: PASS with README and role-template wording updated to skills-native examples

- [ ] **Step 5: Commit**

```bash
git add README.md README.zh-CN.md templates/roles/codex src/utils/__tests__/installer.test.ts
git commit -m "docs: describe cxg as skills-native workflow"
```

### Task 7: Run Full Verification Before Handoff

**Files:**
- Modify: `src/utils/__tests__/installer.test.ts`
- Modify: `src/utils/__tests__/config.test.ts`
- Modify: `src/utils/__tests__/template.test.ts`
- Create: `src/commands/__tests__/doctor.test.ts`

- [ ] **Step 1: Add the last missing regression assertions**

```ts
it('doctor-required skill assets include orchestration and tool support files', () => {
  for (const requiredFile of [
    join(SKILLS_DIR, 'orchestration', 'multi-agent', 'SKILL.md'),
    join(SKILLS_DIR, 'tools', 'verify-change', 'SKILL.md'),
    join(SKILLS_DIR, 'tools', 'verify-module', 'SKILL.md'),
    join(SKILLS_DIR, 'tools', 'verify-quality', 'SKILL.md'),
    join(SKILLS_DIR, 'tools', 'verify-security', 'SKILL.md'),
  ]) {
    expect(existsSync(requiredFile), `required skill asset missing: ${requiredFile}`).toBe(true)
  }
})
```

- [ ] **Step 2: Run the focused suite**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts src/utils/__tests__/config.test.ts src/utils/__tests__/template.test.ts src/commands/__tests__/doctor.test.ts`
Expected: PASS

- [ ] **Step 3: Run the project verification suite**

Run: `pnpm test`
Expected: PASS with all Vitest suites green

Run: `pnpm typecheck`
Expected: PASS with no TypeScript errors

Run: `pnpm lint`
Expected: PASS with no ESLint errors

- [ ] **Step 4: Run one manual lifecycle smoke check**

Run: `pnpm dev doctor`
Expected: Output checks top-level skills, tools, orchestration assets, roles, agents, binary, and legacy prompts as non-blocking info

Run: `pnpm dev init --force --skip-mcp`
Expected: Output reports installed skills and `$cxg-*` usage examples, not custom prompts

- [ ] **Step 5: Commit**

```bash
git add src/utils/__tests__/installer.test.ts src/utils/__tests__/config.test.ts src/utils/__tests__/template.test.ts src/commands/__tests__/doctor.test.ts
git commit -m "test: cover skills-native cxg migration"
```

## Self-Review

### Spec coverage

- Skill-native top-level entrypoints and `templates/skills/` reorganization: covered by Task 1.
- Stop publishing and installing `templates/prompts/`, keep them in-repo only: covered by Task 2.
- Installer, update, uninstall, doctor migration to skills-only managed assets: covered by Tasks 2 and 4.
- Config schema move from `commands.installed` to `skills.installed` with read compatibility: covered by Task 3.
- Docs and README rewrite from `/cxg-*` to `$cxg-*`: covered by Task 6.
- Tests moving from prompt completeness to skill completeness and doctor behavior: covered by Tasks 1, 4, and 7.
- Legacy prompt files remaining non-destructive and non-blocking: covered by Tasks 2 and 4.
- Auxiliary prompt-writing behavior in `config-mcp.ts`: covered by Task 5 so the runtime story stays internally consistent.

### Placeholder scan

- No `TODO`, `TBD`, or “similar to Task N” markers remain.
- Every code-changing task includes concrete file paths, code snippets, commands, and expected results.
- Every verification step names the exact command to run.

### Type consistency

- `ALL_COMMANDS` remains the canonical list of 12 workflow IDs and is reused as top-level skill IDs.
- The new config shape is consistently `skills.installed`; legacy `commands.installed` is read-only compatibility input via `normalizeCxgConfig()`.
- Runtime terminology is consistently “top-level skills,” “shared assets,” “tools,” and “orchestration.”

Plan complete and saved to `docs/superpowers/plans/2026-05-08-cxg-skills-migration.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
