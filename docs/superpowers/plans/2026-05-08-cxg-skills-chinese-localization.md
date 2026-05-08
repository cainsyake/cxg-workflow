# CXG Skills Chinese Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 12 个顶层 `cxg-*` workflow skills 及其共享技能文档从英文说明改为中文说明，同时保持 `$cxg-*` 标识、目录结构、安装路径和测试契约稳定。

**Architecture:** 保留现有 skills-native 目录结构与 frontmatter 标识，只翻译用户实际会读到的说明正文、共享规则文档和技能总览文档。先用测试锁定“中文正文 + 保留 `$cxg-*` 标识”的契约，再分批替换各个 `SKILL.md` 与 `shared/*.md` 文案，最后运行仓库级验证确保安装与发布约束未回归。

**Tech Stack:** TypeScript, Vitest, Markdown skill templates, pnpm

---

## File Structure

### Scope Files

- `src/utils/__tests__/installer.test.ts`
  负责校验已发布 skill 资产的结构、标题、共享引用和用户入口文案；本次需要把英文断言切换为中文断言，并新增“英文样板已消失”的检查。
- `templates/skills/cxg-workflow/SKILL.md`
  顶层总编排入口；需要中文化用途、输入、流程、交付物描述，同时保留 `$cxg-workflow` 名称。
- `templates/skills/cxg-plan/SKILL.md`
  计划入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-execute/SKILL.md`
  执行入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-feat/SKILL.md`
  功能开发入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-analyze/SKILL.md`
  只读分析入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-debug/SKILL.md`
  调试修复入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-optimize/SKILL.md`
  优化入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-test/SKILL.md`
  测试入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-review/SKILL.md`
  评审入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-enhance/SKILL.md`
  需求增强入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-commit/SKILL.md`
  提交入口；需要中文化正文并保留共享引用路径。
- `templates/skills/cxg-init/SKILL.md`
  上下文初始化入口；需要中文化正文并保留共享引用路径。
- `templates/skills/shared/workflow-rules.md`
  所有 `$cxg-*` skill 共享的工作流规则；需要统一翻译为中文，避免顶层 skill 仍引用英文共享文档。
- `templates/skills/shared/interaction-checkpoints.md`
  共享交互检查点；需要统一翻译为中文。
- `templates/skills/shared/output-contracts.md`
  共享输出契约；需要统一翻译为中文。
- `templates/skills/SKILL.md`
  已安装 `cxg` 技能树的总览说明；需要改为中文目录与导航说明，保证安装后的总览体验一致。

### Out Of Scope

- `templates/prompts/`
  这些是历史 prompt 参考资产，不是用户当前调用的 `cxg-*` skills；本计划不翻译。
- `README.md`
  英文 README 继续保留英文；若后续需要同步调整文档语言，再单独立项。
- `README.zh-CN.md`
  当前已是中文，不作为本次主目标。
- `src/utils/constants.ts`
  `id`、`nameEn`、`descriptionEn` 是程序配置层字段，不属于 `cxg-*` skill 正文；除非产品要求菜单也去英文，否则本次不动。

## Localization Contract

本次中文化统一采用以下结构，12 个顶层 workflow skills 必须一致：

```md
# $cxg-<id>

当用户……时，使用此技能。

## 用途

- …

## 预期输入

- …

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. …

## 交付结果

- …
```

共享文档标题统一为：

```md
# 工作流规则
# 交互检查点
# 输出约定
```

总览文档标题统一为：

```md
# CXG 技能总览
```

## Task 1: Lock The Chinese Localization Contract In Tests

**Files:**
- Modify: `src/utils/__tests__/installer.test.ts`
- Test: `src/utils/__tests__/installer.test.ts`

- [ ] **Step 1: 将 installer 测试改成中文技能契约断言**

```ts
const REQUIRED_WORKFLOW_SKILL_SECTIONS = [
  '## 用途',
  '## 预期输入',
  '## 共享指引',
  '## 工作流程',
  '## 交付结果',
]
const REQUIRED_WORKFLOW_SHARED_REFERENCES = [
  '../shared/workflow-rules.md',
  '../shared/interaction-checkpoints.md',
  '../shared/output-contracts.md',
]
const LOCALIZED_SHARED_DOC_HEADINGS = [
  ['workflow-rules.md', '# 工作流规则'],
  ['interaction-checkpoints.md', '# 交互检查点'],
  ['output-contracts.md', '# 输出约定'],
] as const

it('workflow skill entrypoints include the shared content contract', () => {
  for (const commandId of ALL_COMMANDS) {
    const skillEntryPath = join(SKILLS_DIR, commandId, 'SKILL.md')
    const content = readFileSync(skillEntryPath, 'utf-8')

    for (const section of REQUIRED_WORKFLOW_SKILL_SECTIONS) {
      expect(
        content.includes(section),
        `${commandId} missing required section: ${section}`,
      ).toBe(true)
    }

    expect(
      content.includes('当用户') && content.includes('使用此技能'),
      `${commandId} should use the Chinese "when to use" sentence`,
    ).toBe(true)
    expect(
      content.includes('Use this skill when'),
      `${commandId} should not keep the English boilerplate`,
    ).toBe(false)

    for (const sharedReference of REQUIRED_WORKFLOW_SHARED_REFERENCES) {
      expect(
        content.includes(sharedReference),
        `${commandId} missing shared guidance reference: ${sharedReference}`,
      ).toBe(true)
    }
  }
})

it('shared skill docs are localized in Chinese', () => {
  for (const [fileName, heading] of LOCALIZED_SHARED_DOC_HEADINGS) {
    const content = readFileSync(join(SKILLS_DIR, 'shared', fileName), 'utf-8')
    expect(content.includes(heading), `${fileName} missing localized heading`).toBe(true)
    expect(content.includes('# Workflow Rules')).toBe(false)
    expect(content.includes('# Interaction Checkpoints')).toBe(false)
    expect(content.includes('# Output Contracts')).toBe(false)
  }

  const rootSkillOverview = readFileSync(join(SKILLS_DIR, 'SKILL.md'), 'utf-8')
  expect(rootSkillOverview.includes('# CXG 技能总览')).toBe(true)
  expect(rootSkillOverview.includes('## 工作流技能')).toBe(true)
  expect(rootSkillOverview.includes('## 共享指引')).toBe(true)
  expect(rootSkillOverview.includes('## 质量关卡')).toBe(true)
  expect(rootSkillOverview.includes('## 多智能体编排')).toBe(true)
  expect(rootSkillOverview.includes('# CXG Skills')).toBe(false)
})
```

- [ ] **Step 2: 运行定向测试，确认当前英文模板会失败**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`

Expected: FAIL，至少包含以下一种失败信号：

- `missing required section: ## 用途`
- `should use the Chinese "when to use" sentence`
- `workflow-rules.md missing localized heading`
- `rootSkillOverview.includes('# CXG 技能总览')`

- [ ] **Step 3: 如有必要，补上对英文旧标题的负向断言**

```ts
const ENGLISH_SECTION_MARKERS = [
  '## Purpose',
  '## Expected Input',
  '## Shared Guidance',
  '## Workflow',
  '## Deliverable',
] as const

for (const englishMarker of ENGLISH_SECTION_MARKERS) {
  expect(
    content.includes(englishMarker),
    `${commandId} should not keep English section heading: ${englishMarker}`,
  ).toBe(false)
}
```

- [ ] **Step 4: 再次运行定向测试，确认失败点已经完全对准中文化目标**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`

Expected: FAIL，但失败应只来自尚未翻译的 skill/shared 文档，而不是测试自身语法或类型错误

- [ ] **Step 5: Commit**

```bash
git add src/utils/__tests__/installer.test.ts
git commit -m "test: lock cxg skill localization contract"
```

## Task 2: Translate The Core Workflow Skill Entrypoints

**Files:**
- Modify: `templates/skills/cxg-workflow/SKILL.md`
- Modify: `templates/skills/cxg-plan/SKILL.md`
- Modify: `templates/skills/cxg-execute/SKILL.md`
- Modify: `templates/skills/cxg-feat/SKILL.md`

- [ ] **Step 1: 将 `cxg-workflow` 与 `cxg-plan` 改为中文正文**

```md
---
name: cxg-workflow
description: 以结构化方式贯穿研究、规划、实现、优化与评审的端到端开发工作流。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-workflow

当用户希望把一个开发任务从发现问题一路推进到可交付结果时，使用此技能。

## 用途

- 统筹单个任务的完整开发生命周期。
- 在适合的时候转入更聚焦的 `$cxg-*` 技能处理具体阶段。
- 让进度始终由证据、用户确认与验证结果驱动。

## 预期输入

- 任务描述、功能需求、缺陷报告，或明确的改动目标。
- 可选约束，例如截止时间、文件边界、测试要求或实现偏好。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 重述目标、范围和当前假设。
2. 检查仓库上下文，判断任务更偏向分析、规划、实现、优化还是评审。
3. 按顺序推进各阶段：研究、方案整理、规划、执行、优化、评审。
4. 在重要阶段切换或权衡开始显著影响结果时暂停并等待用户确认。
5. 用与实际工作匹配的命令验证最终状态。

## 交付结果

- 按阶段总结已学习到的信息和已完成的工作。
- 给出每个阶段已经完成或下一步建议推进的动作。
- 附带验证证据和仍需关注的残余风险。
```

```md
---
name: cxg-plan
description: 在不修改产品代码的前提下，为仓库任务生成可执行的实施计划。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-plan

当用户希望在开始改代码前先拿到一份可执行计划时，使用此技能。

## 用途

- 将需求翻译为有明确范围和验证步骤的实施计划。
- 在规划阶段保持只读，除非用户明确要求产出计划文件或其他计划资产。

## 预期输入

- 任务描述、功能请求、迁移步骤，或已有计划文件的更新请求。
- 可选约束，例如目标文件、执行顺序、责任边界或测试要求。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 确认目标、非目标以及仍缺失的约束。
2. 检查相关文件、测试和仓库约定。
3. 将工作拆解为有顺序的步骤，并写明涉及文件和验证命令。
4. 标注依赖关系、风险决策和任何需要用户批准的前置事项。
5. 保持计划可直接执行，避免在规划阶段修改产品代码。

## 交付结果

- 一份包含目标文件、测试与验收检查点的顺序化计划。
- 如果存在阻塞，附上简短的风险清单或待确认问题。
```

- [ ] **Step 2: 检查这两个核心技能已经完全去掉英文样板**

Run: `rg -n "Use this skill when|## Purpose|## Expected Input|## Shared Guidance|## Workflow|## Deliverable" templates/skills/cxg-workflow/SKILL.md templates/skills/cxg-plan/SKILL.md`

Expected: no output

- [ ] **Step 3: 将 `cxg-execute` 与 `cxg-feat` 改为中文正文**

```md
---
name: cxg-execute
description: 执行已批准的计划，完成所需代码或内容改动，并在结束前完成验证。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-execute

当任务方向已经明确，只需要聚焦落地实现时，使用此技能。

## 用途

- 把已批准的计划或明确任务落地成可工作的仓库改动。
- 让修改保持范围清晰、便于审阅，并在宣布完成前完成验证。

## 预期输入

- 计划文件路径、已批准的检查清单，或直接的实现请求。
- 可选护栏，例如不要触碰的文件、必须运行的测试，或提交要求。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 重新确认执行范围，并明确完成证明应该是什么。
2. 检查当前实现，并在行为发生变化时编写或更新测试。
3. 只做满足请求所需的最小完整修改集合。
4. 运行定向验证命令，并在继续前修复失败项。
5. 总结改动内容、验证结果以及用户需要知道的后续事项。

## 交付结果

- 已实现的改动。
- 与计划或任务请求对应的验证结果。
```

```md
---
name: cxg-feat
description: 从需求整理到实现交付，端到端完成一个新功能切片。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-feat

当用户提出一个新功能，并希望你一路推进到可以交付时，使用此技能。

## 用途

- 将功能需求整理成可实现的范围。
- 协调规划、实现和验证，交付一个新的功能切片。

## 预期输入

- 功能描述、增强请求，或用户故事。
- 可选约束，例如 UX、API、性能或兼容性要求。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 澄清功能目标、边界和成功标准。
2. 检查现有模式，并识别该功能会触达的模块。
3. 如果需求还不能直接实施，先产出一份轻量计划。
4. 以增量方式实现，并在行为变化时新增或更新测试。
5. 验证新功能，并总结权衡点或后续扩展方向。

## 交付结果

- 一个已落地或已达到实现就绪状态的功能切片。
- 关于验证结果、剩余缺口和下一轮迭代建议的说明。
```

- [ ] **Step 4: 检查新增的两个核心技能也满足中文化契约**

Run: `rg -n "Use this skill when|## Purpose|## Expected Input|## Shared Guidance|## Workflow|## Deliverable" templates/skills/cxg-execute/SKILL.md templates/skills/cxg-feat/SKILL.md`

Expected: no output

- [ ] **Step 5: Commit**

```bash
git add templates/skills/cxg-workflow/SKILL.md templates/skills/cxg-plan/SKILL.md templates/skills/cxg-execute/SKILL.md templates/skills/cxg-feat/SKILL.md
git commit -m "feat: localize core cxg workflow skills"
```

## Task 3: Translate The Analysis, Quality, And Delivery Skill Entrypoints

**Files:**
- Modify: `templates/skills/cxg-analyze/SKILL.md`
- Modify: `templates/skills/cxg-debug/SKILL.md`
- Modify: `templates/skills/cxg-optimize/SKILL.md`
- Modify: `templates/skills/cxg-test/SKILL.md`
- Modify: `templates/skills/cxg-review/SKILL.md`
- Modify: `templates/skills/cxg-enhance/SKILL.md`
- Modify: `templates/skills/cxg-commit/SKILL.md`
- Modify: `templates/skills/cxg-init/SKILL.md`

- [ ] **Step 1: 先翻译分析、调试、优化、测试四个入口**

```md
---
name: cxg-analyze
description: 在不修改产品代码的前提下，深入分析代码库问题、设计或实现路径。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-analyze

当用户需要理解现状，而不是立即改代码时，使用此技能。

## 用途

- 收集仓库证据并解释系统当前如何工作。
- 在不动代码的前提下，指出约束、风险和可能的实现路径。

## 预期输入

- 一个问题、调查目标、架构顾虑，或决策点。
- 可选聚焦信息，例如文件路径、符号名、报错信息或额外约束。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 准确定义问题，并列出回答它所需的信号。
2. 检查相关代码、测试、配置和文档。
3. 区分“已观察到的事实”和“推断”，并标明信心程度。
4. 如果有帮助，对 2 到 3 种实现或修复方案做权衡比较。
5. 除非用户明确改任务，否则始终保持只读。

## 交付结果

- 带文件引用的分析结论。
- 假设、风险以及建议的下一步动作。
```

```md
---
name: cxg-debug
description: 以证据驱动方式复现、定位并修复缺陷，同时补上回归证明。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-debug

当用户报告异常行为、失败测试或运行时错误时，使用此技能。

## 用途

- 从表面症状推进到已确认的根因。
- 用最小且安全的修改修复问题，并证明问题已经解决。

## 预期输入

- 缺陷描述、失败命令、堆栈信息，或复现方式。
- 可选约束，例如影响范围、回归顾虑或环境边界。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 重述症状，并明确如何复现或观察它。
2. 检查相关代码路径、测试、日志和最近改动。
3. 提出根因假设，并用证据逐一验证。
4. 当行为发生变化时，在修复前或修复同时补上回归覆盖。
5. 用复现路径和定向测试验证修复结果。

## 交付结果

- 已确认的根因。
- 修复方案、回归覆盖和验证证据。
```

```md
---
name: cxg-optimize
description: 分析瓶颈并实施高价值优化，同时给出可度量的验证结果。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-optimize

当用户希望提升性能、降低成本，或简化高频执行路径时，使用此技能。

## 用途

- 找出当前最值得处理的瓶颈。
- 按预期收益、实施成本和回归风险来排序优化动作。

## 预期输入

- 优化目标，例如延迟、吞吐、包体积，或资源使用。
- 可选背景，例如基线、profiling 数据、SLA，或怀疑的热点文件。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 定义优化指标和当前基线。
2. 检查相关实现、埋点和测试。
3. 找出杠杆最高的机会点，并说明权衡。
4. 在功能风险最小的前提下落地已批准的优化。
5. 用最合适的验证命令或基准重新测量结果。

## 交付结果

- 优先级明确的优化结论。
- 已实施的改动，以及可测量时的前后对比结果。
```

```md
---
name: cxg-test
description: 按照仓库既有测试策略设计并补充有针对性的测试覆盖。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-test

当用户需要新增测试、强化覆盖，或验证高风险区域时，使用此技能。

## 用途

- 用贴合项目约定的测试提升信心。
- 覆盖关键行为、边界条件和回归场景，而不是另起一套测试风格。

## 预期输入

- 要测试的功能区域、缺陷修复、文件路径、函数，或验收场景。
- 可选约束，例如测试框架、执行速度、fixture 或覆盖优先级。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 检查目标代码及其周围已有测试模式。
2. 识别最有价值的场景：正常路径、边界情况、失败路径和回归场景。
3. 按现有框架与命名约定新增或更新测试。
4. 先运行最小有用测试命令，再根据需要扩大验证范围。
5. 说明现在覆盖了什么，以及仍未覆盖什么。

## 交付结果

- 新增或更新后的测试。
- 简短的覆盖总结和验证结果。
```

- [ ] **Step 2: 检查这一批技能的英文段落已经清空**

Run: `rg -n "Use this skill when|## Purpose|## Expected Input|## Shared Guidance|## Workflow|## Deliverable" templates/skills/cxg-analyze/SKILL.md templates/skills/cxg-debug/SKILL.md templates/skills/cxg-optimize/SKILL.md templates/skills/cxg-test/SKILL.md`

Expected: no output

- [ ] **Step 3: 再翻译评审、需求增强、提交、初始化四个入口**

```md
---
name: cxg-review
description: 以 findings-first 方式审查改动的正确性、回归风险、缺失验证与整体风险。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-review

当用户需要代码审查，或希望对一组改动做质量把关时，使用此技能。

## 用途

- 在合并或发布前评估改动风险。
- 把具体问题放在泛泛评论之前。

## 预期输入

- 一个 diff、分支、文件路径，或“审查当前工作区改动”的请求。
- 可选聚焦方向，例如安全、性能、测试或 API 行为。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 确定评审范围，并收集相关 diff 与上下文。
2. 优先检查功能缺陷、行为回归、危险假设和缺失测试。
3. 按严重程度排序 findings，并附上文件引用。
4. 如果没有发现问题，也要明确说明，并补充残余风险或覆盖缺口。
5. 让总结保持简洁，并始终从属于 findings。

## 交付结果

- 按严重级别排序的 findings-first 评审结果。
- 待确认问题、前提假设和简短的总体评估。
```

```md
---
name: cxg-enhance
description: 在不改变用户意图的前提下，把粗糙请求整理成结构化任务简报。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-enhance

当用户的请求还不够具体，先整理成更清晰的任务简报会更稳妥时，使用此技能。

## 用途

- 将模糊输入整理为可执行任务描述。
- 在不改变用户目标的前提下，显式写出范围、约束和验收标准。

## 预期输入

- 原始请求、简短想法，或边界模糊的任务描述。
- 可选上下文，例如目标文件、技术栈、时间要求或质量预期。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 提炼目标结果、约束条件和缺失信息。
2. 仅在必要时检查仓库，以便让任务描述贴近真实代码与约定。
3. 以结构化格式重写任务，写清目标、边界和验证信号。
4. 标出仍需要用户确认的不确定点。
5. 除非用户明确把任务切换成执行，否则不要直接开始实现。

## 交付结果

- 一份可直接交给 `$cxg-plan`、`$cxg-execute` 或其他 `$cxg-*` 技能使用的增强任务简报。
- 一份简短的待确认问题列表。
```

```md
---
name: cxg-commit
description: 基于当前仓库改动，准备一条范围清晰的 Conventional Commit 提交。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-commit

当用户需要帮助整理暂存范围、界定提交边界或生成提交信息时，使用此技能。

## 用途

- 准确概括当前改动集合。
- 生成与仓库历史和改动范围匹配的 Conventional Commit 信息。

## 预期输入

- 当前工作区改动，可选地附带 `--all`、`--amend` 或期望的 type/scope。
- 可选说明，例如暂存边界、hook 行为或提交策略。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 检查 git status、已暂存改动和未暂存改动。
2. 判断这些工作应当形成一个提交，还是需要拆分成多个提交。
3. 基于真实 diff 推荐合适的 Conventional Commit type 和 scope。
4. 如果用户要求直接执行，只暂存目标文件，并用非交互方式创建提交。
5. 汇报最终提交信息以及任何范围边界上的注意事项。

## 交付结果

- 一条聚焦的 Conventional Commit 建议，或已经实际创建的提交。
- 清楚说明哪些文件被暂存、哪些被排除，以及提交后的 SHA。
```

```md
---
name: cxg-init
description: 初始化或刷新仓库上下文资产，例如 AGENTS.md 及相关指导文档。
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-init

当用户希望为 agentic 协作补齐项目上下文脚手架，或刷新现有指导文档时，使用此技能。

## 用途

- 生成或更新高信号的仓库指导资产。
- 让文档与当前模块结构和工作流预期保持一致。

## 预期输入

- 项目摘要、上手目标，或刷新 `AGENTS.md` 风格上下文的请求。
- 可选边界，例如要包含、忽略，或重点展开的目录。

## 共享指引

- 工作流规则：`../shared/workflow-rules.md`
- 交互检查点：`../shared/interaction-checkpoints.md`
- 输出约定：`../shared/output-contracts.md`

## 工作流程

1. 检查仓库结构、关键入口点和现有指导文档。
2. 判断应该新建或更新哪些上下文资产。
3. 先写简洁的根级指导，再按需要补充更细的模块级指导。
4. 除非用户额外要求代码改动，否则只做文档层面的更新。
5. 验证生成的文件内部一致、易于导航。

## 交付结果

- 新增或更新后的仓库上下文文档。
- 对覆盖范围、跳过区域和建议后续动作的简短总结。
```

- [ ] **Step 4: 再次检查第二批技能的英文样板已经完全移除**

Run: `rg -n "Use this skill when|## Purpose|## Expected Input|## Shared Guidance|## Workflow|## Deliverable" templates/skills/cxg-review/SKILL.md templates/skills/cxg-enhance/SKILL.md templates/skills/cxg-commit/SKILL.md templates/skills/cxg-init/SKILL.md`

Expected: no output

- [ ] **Step 5: Commit**

```bash
git add templates/skills/cxg-analyze/SKILL.md templates/skills/cxg-debug/SKILL.md templates/skills/cxg-optimize/SKILL.md templates/skills/cxg-test/SKILL.md templates/skills/cxg-review/SKILL.md templates/skills/cxg-enhance/SKILL.md templates/skills/cxg-commit/SKILL.md templates/skills/cxg-init/SKILL.md
git commit -m "feat: localize remaining cxg workflow skills"
```

## Task 4: Translate Shared Skill Docs And The Installed Overview

**Files:**
- Modify: `templates/skills/shared/workflow-rules.md`
- Modify: `templates/skills/shared/interaction-checkpoints.md`
- Modify: `templates/skills/shared/output-contracts.md`
- Modify: `templates/skills/SKILL.md`
- Test: `src/utils/__tests__/installer.test.ts`

- [ ] **Step 1: 将三个共享技能文档统一翻译为中文**

```md
# 工作流规则

除非某个 skill 明确收窄范围，否则以下规则适用于所有 `$cxg-*` 技能。

## 核心原则

1. 严格停留在用户批准的范围内；如果需要扩展任务，先说明原因。
2. 优先依据仓库证据，而不是主观假设；结论前先读相关文件。
3. 保持输出可执行；每条建议都应映射到下一步、文件或命令。
4. 保护用户已有工作；绝不回滚无关改动。
5. 遵循仓库现有的格式、命名、测试和提交约定。

## 执行纪律

1. 从重述目标、约束和必须做出的假设开始。
2. 在提出方案或动手修改前先检查当前工作区。
3. 使用能安全完成任务的最小工作流。
4. 如果任务涉及实现、测试或评审，要提前说明如何验证成功。
5. 当任务偏向实现时，优先采用 test-first 或 verification-first 循环。

## 范围边界

1. 把任何 legacy prompt 模板或仓库内部脚手架视为可选参考，而不是默认权威来源。
2. 直接修改范围只限于当前任务必需的文件。
3. 如果工作区存在并发改动，应适配它们，而不是覆盖它们。
4. 只有在决策会显著影响产品、架构或工作流时才升级沟通。

## 决策规则

1. 只有当歧义会改变实现路径时才追问澄清。
2. 如果存在多条可行路径，推荐一条并简要说明权衡。
3. 如果请求无法被验证，要明确说明缺口和最接近的安全结果。
```

```md
# 交互检查点

使用这些检查点，让 `$cxg-*` 技能在协作中保持可预期、可跟进。

## 开始工作前

1. 用一到两句话确认请求目标。
2. 说明你马上要执行的第一个具体动作。
3. 指出任何因为请求未明确而不得不采用的假设。

## 调研过程中

1. 说明你正在收集什么上下文，以及它为什么重要。
2. 尽早暴露阻塞，尤其是缺文件、测试失败或冲突改动。
3. 如果任务分多个阶段，告诉用户当前处于哪个阶段。

## 编辑文件前

1. 说明即将创建或修改哪些文件。
2. 明确这是增量修改、结构调整还是行为变更。
3. 如果改动可能影响现有工作流，要提前说出预期影响。

## 宣布完成前

1. 运行与任务匹配的验证命令。
2. 阅读完整结果，并记录任何失败或警告。
3. 说明哪些已通过、哪些没有检查，以及残余风险是什么。

## 需要升级沟通时

1. 在不可逆操作或非显而易见的权衡前先暂停。
2. 用简洁选项呈现路径，并给出推荐方案。
3. 如果选择会改变范围、行为或历史，等待用户确认后再继续。
```

```md
# 输出约定

每个 `$cxg-*` 技能都应产出易于审阅、易于执行的结果。

## 最小输出结构

1. `Goal`：技能理解到的用户目标是什么。
2. `Context`：哪些文件、系统或约束最关键。
3. `Work`：执行了哪些分析、计划、改动或命令。
4. `Result`：最终交付了什么、决定了什么，或推荐了什么。
5. `Verification`：运行了哪些检查；如果没有完成验证，也要说明原因。

## 按技能类型的交付要求

- 分析类技能应返回 findings、假设、风险和建议的下一步动作。
- 规划类技能应返回顺序化步骤、涉及文件和验证点。
- 执行类技能应返回已实现改动、运行过的测试和任何后续工作。
- 评审类技能应先返回按优先级排序的问题，再给总体评估。
- 元技能应返回可复用资产，例如 prompts、计划、提交信息或文档。

## 质量门槛

1. 明确说明该技能是否修改了文件，还是保持只读。
2. 尽量使用文件路径、命令和验收标准，而不是抽象建议。
3. 清楚区分观察事实与推断结论。
4. 没有验证证据时，不要暗示已经成功。
5. 让总结足够简洁，便于队友快速扫读。
```

- [ ] **Step 2: 将根级 `templates/skills/SKILL.md` 改成中文总览**

```md
---
name: cxg-skills
description: CXG 技能资产总览，包含工作流入口、共享指引、质量关卡与编排辅助能力。
license: MIT
user-invocable: false
disable-model-invocation: false
---

# CXG 技能总览

## 目录结构

```text
skills/
├── cxg-workflow/          # 端到端工作流入口
├── cxg-plan/              # 规划入口
├── cxg-execute/           # 执行入口
├── cxg-feat/              # 功能交付入口
├── cxg-analyze/           # 只读分析入口
├── cxg-debug/             # 调试修复入口
├── cxg-optimize/          # 优化入口
├── cxg-test/              # 测试入口
├── cxg-review/            # 评审入口
├── cxg-enhance/           # 需求增强入口
├── cxg-commit/            # 提交准备入口
├── cxg-init/              # 上下文初始化入口
├── shared/                # 复用的规则、检查点与输出约定
├── tools/                 # 质量关卡与生成器
│   ├── verify-security/
│   ├── verify-quality/
│   ├── verify-change/
│   ├── verify-module/
│   ├── gen-docs/
│   └── lib/
├── orchestration/         # 协同编排辅助能力
│   └── multi-agent/
├── run_skill.js           # 面向工具型工作流的辅助 runner
└── SKILL.md               # 本文件
```

## 快速导航

| 分类 | 说明 | 入口 |
|------|------|------|
| **工作流入口** | 用户直接调用的 `$cxg-*` 技能，覆盖规划、执行、分析与交付 | [工作流技能](#工作流技能) |
| **共享指引** | 复用的工作流规则、交互检查点与输出约定 | [共享指引](#共享指引) |
| **质量关卡** | 模块完整性、安全、质量与变更验证 | [质量关卡](#质量关卡) |
| **多智能体编排** | 多智能体协作与任务拆分辅助能力 | [多智能体编排](#多智能体编排) |

---

## 工作流技能

这些是面向用户的技能入口。描述时统一称它们为 `$cxg-*` 技能，而不是 prompt 命令。

| 技能 | 主要用途 |
|------|----------|
| `$cxg-workflow` | 将任务贯穿研究、规划、执行、优化与评审 |
| `$cxg-plan` | 在不修改产品代码的前提下生成实施计划 |
| `$cxg-execute` | 执行已批准的计划并验证结果 |
| `$cxg-feat` | 从需求整理一路交付新功能 |
| `$cxg-analyze` | 只分析代码库，不直接修改 |
| `$cxg-debug` | 诊断并修复缺陷，同时补上回归证明 |
| `$cxg-optimize` | 用可度量的方式提升性能或效率 |
| `$cxg-test` | 补充或强化测试覆盖 |
| `$cxg-review` | 审查改动的正确性、风险与回归问题 |
| `$cxg-enhance` | 将粗糙需求改写成结构化任务简报 |
| `$cxg-commit` | 准备或执行聚焦的 Conventional Commit |
| `$cxg-init` | 初始化或刷新面向 agent 的仓库指导文档 |

## 共享指引

共享 markdown 资产用于让所有入口技能保持一致：

- `shared/workflow-rules.md` 定义执行纪律、范围控制和决策规则。
- `shared/interaction-checkpoints.md` 定义进度更新、升级沟通时机和验证检查点。
- `shared/output-contracts.md` 定义技能输出的结构和质量门槛。

## 质量关卡

**这些技能用于保证交付物达到既定质量标准。**

| 技能 | 触发时机 | 说明 |
|------|----------|------|
| `verify-module` | 新模块完成后 | 检查模块结构与文档完整性 |
| `verify-security` | 新模块、安全改动、重构 | 扫描安全漏洞与高风险模式 |
| `verify-change` | 设计级变更、重构 | 分析变更影响并检查文档同步 |
| `verify-quality` | 复杂模块、重构 | 检查代码质量指标 |
| `gen-docs` | 新模块创建后 | 生成 README.md 与 DESIGN.md 骨架 |

### 自动触发规则

```text
新模块：     gen-docs -> implementation -> verify-module -> verify-security
代码变更：   implementation -> verify-change -> verify-quality
安全任务：   execution -> verify-security
重构任务：   refactor -> verify-change -> verify-quality -> verify-security
```

### 工具型技能运行方式

顶层 `$cxg-*` 入口以宿主环境中的技能形式调用。`run_skill.js` 只服务于 `verify-security`、`verify-quality`、`verify-change`、`verify-module`、`gen-docs` 这类工具型工作流。

```bash
# Tool workflow runner
node ~/.codex/skills/cxg/run_skill.js <skill-name> [args...]

# Examples for tools/ skills
node ~/.codex/skills/cxg/run_skill.js verify-security ./src
node ~/.codex/skills/cxg/run_skill.js verify-quality ./src -v
node ~/.codex/skills/cxg/run_skill.js verify-change --mode staged
node ~/.codex/skills/cxg/run_skill.js verify-module ./my-module
node ~/.codex/skills/cxg/run_skill.js gen-docs ./new-module --force
```

---

## 多智能体编排

| 技能 | 触发时机 | 说明 |
|------|----------|------|
| `multi-agent` | TeamCreate、并行任务、多智能体协作 | 基于蚁群思路的多智能体协同能力 |

提供能力：

- 角色体系（Lead / Scout / Worker / Soldier / Drone）
- 信息素式间接通信
- 文件所有权锁与冲突规避
- 自适应并发控制
- TeamCreate 与单智能体模式的决策树

## 由 CXG 自动安装

这些技能会在 `npx cxg-workflow init` 时自动安装。
更新时可运行：`npx cxg-workflow update` 或 `npx cxg-workflow init --force`。
```

- [ ] **Step 3: 运行定向测试，确认共享文档与总览文档都满足中文契约**

Run: `pnpm test -- src/utils/__tests__/installer.test.ts`

Expected: PASS for:

- `workflow skill entrypoints include the shared content contract`
- `shared skill docs are localized in Chinese`
- `top-level shipped skill docs advertise $cxg-* entrypoints instead of slash commands`

- [ ] **Step 4: 用 `rg` 再做一次英文残留扫描**

Run: `rg -n "Use this skill when|# Workflow Rules|# Interaction Checkpoints|# Output Contracts|# CXG Skills|## Purpose|## Expected Input|## Shared Guidance|## Workflow|## Deliverable" templates/skills`

Expected: no output

- [ ] **Step 5: Commit**

```bash
git add templates/skills/shared/workflow-rules.md templates/skills/shared/interaction-checkpoints.md templates/skills/shared/output-contracts.md templates/skills/SKILL.md src/utils/__tests__/installer.test.ts
git commit -m "feat: localize shared cxg skill documentation"
```

## Task 5: Run Full Verification And Polish Any Missed Copy

**Files:**
- Modify: `templates/skills/**/*.md` (only if verification exposes missed English copy)
- Modify: `src/utils/__tests__/installer.test.ts` (only if verification exposes brittle assertions)
- Test: `src/utils/__tests__/installer.test.ts`

- [ ] **Step 1: 运行完整验证命令**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected:

- `pnpm test`: PASS
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS

- [ ] **Step 2: 如果验证失败，只修复本次中文化引入的问题**

```md
# 允许的修复范围

- 补翻遗漏的英文标题或句子
- 修正测试断言与实际中文模板之间的不一致
- 修正 markdown 中因翻译引入的格式问题

# 不要做的事

- 不改 skill id、目录名或 `$cxg-*` 调用名
- 不顺手改 `templates/prompts/`
- 不扩展到 README 英文化/中文化同步改造
```

- [ ] **Step 3: 重新运行完整验证，直到全部通过**

Run: `pnpm test && pnpm typecheck && pnpm lint`

Expected:

- 全部 PASS
- 没有新的 snapshot / string-contract 回归

- [ ] **Step 4: 记录最终 diff 范围，确认只有中文化相关文件**

Run: `git diff --stat HEAD~1..HEAD`

Expected: 只出现 `templates/skills/**/*.md` 与 `src/utils/__tests__/installer.test.ts`，或其中的子集

- [ ] **Step 5: Commit**

```bash
git add templates/skills src/utils/__tests__/installer.test.ts
git commit -m "test: verify cxg skill localization rollout"
```

## Self-Review

### Spec Coverage

- 12 个 `cxg-*` 顶层 skill：由 Task 2 和 Task 3 覆盖。
- 共享 skill 文档：由 Task 4 覆盖。
- 安装后的总览 skill：由 Task 4 覆盖。
- 测试与回归保护：由 Task 1 与 Task 5 覆盖。

### Placeholder Scan

- 计划中未使用 `TODO`、`TBD`、`implement later`。
- 每个改代码步骤都包含了具体 markdown / TypeScript 内容或明确修复边界。
- 每个验证步骤都包含了精确命令与预期结果。

### Type Consistency

- 所有顶层 skills 统一使用 `## 用途`、`## 预期输入`、`## 共享指引`、`## 工作流程`、`## 交付结果`。
- 所有共享引用路径统一保持为 `../shared/workflow-rules.md`、`../shared/interaction-checkpoints.md`、`../shared/output-contracts.md`。
- 所有技能入口标题统一保持 `$cxg-*` 形式，不改 `name` 字段和目录名。
