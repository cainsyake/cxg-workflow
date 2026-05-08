# CXG Workflow Skills-Native 迁移设计

## 概述

当前的 CXG Workflow 会将 12 个 `/cxg-*` custom prompts 安装到 `~/.codex/prompts/`，同时再把一小组 skills 安装到 `~/.codex/skills/cxg/`。新版本 Codex 已不再支持 `/cxg-*` 这种 custom prompt 调用模型，因此 CXG 需要从 prompt-centered 的分发与调用方式迁移为 skills-native 模型，并围绕显式的 `$cxg-*` skill 调用重新组织整体实现。

这次迁移会保留现有 12 个工作流入口的概念边界，但会将它们重新实现为顶层、用户可见的 skills：

- `$cxg-workflow`
- `$cxg-plan`
- `$cxg-execute`
- `$cxg-feat`
- `$cxg-analyze`
- `$cxg-debug`
- `$cxg-optimize`
- `$cxg-test`
- `$cxg-review`
- `$cxg-enhance`
- `$cxg-commit`
- `$cxg-init`

这次迁移不是简单地把 prompt 原文包一层改成 skill。新的实现会重构整个 `templates/skills/` 树，使其更符合 Codex skills 的使用方式，明确偏向用户显式调用，并通过共享资产减少重复的工作流说明。

## 目标

- 用显式的 `$cxg-*` skill 调用替代 `/cxg-*` custom prompt 调用。
- 保持当前 12 个工作流入口的一对一顶层 skill 形态。
- 将 CXG 的用户入口分发模型重构为 `skills-only`。
- 统一并现代化现有的 `templates/skills/` 结构，而不是仅新增 12 个包装层 skills。
- 将旧的 `templates/prompts/` 保留在仓库中作为迁移参考，但不再发布、不再安装。
- 避免对用户机器做破坏性迁移，不主动删除已有的 `~/.codex/prompts/cxg-*.md`。

## 非目标

- 不再追求在新版本 Codex 中维持 `/cxg-*` 的运行时兼容。
- 不强行保留 prompt 时代的实现结构；如果它与更清晰的 skills-native 结构冲突，应以后者为准。
- 不自动清理用户机器上的 legacy prompt 文件。
- 不重新定义这 12 个工作流入口的语义职责。

## 用户体验

### 调用模型

用户将通过 `$cxg-*` 名称显式调用顶层 skills。主要使用模式是按名字直接调用，而不是依赖 Codex 自动挑选。

示例：

```text
$cxg-workflow implement invoice export with audit logging
$cxg-plan refactor payment service
$cxg-review
```

### 行为预期

- 每个顶层 skill 对现有 CXG 用户来说都应当仍然可辨认。
- 12 个入口的名称与总体职责保持稳定。
- 内部工作流内容允许为了适配 skills 语义而重写。
- tooling 和 orchestration skills 仍然保留，但它们主要是支撑资产，而不是首要的用户入口界面。

## 仓库结构

### 当前状态

- `templates/prompts/` 包含 12 个用户可见的工作流 prompt 文件。
- `templates/skills/` 包含一个根级的 `cxg-skills` skill、`run_skill.js`、若干工具型 skills，以及 orchestration helpers。
- 安装逻辑当前将 prompt 文件视为主命令面，将 skills 视为次级资产组。

### 目标状态

`templates/skills/` 将成为唯一的工作流主入口，并重组为四层结构：

```text
templates/skills/
├── cxg-workflow/
│   └── SKILL.md
├── cxg-plan/
│   └── SKILL.md
├── cxg-execute/
│   └── SKILL.md
├── cxg-feat/
│   └── SKILL.md
├── cxg-analyze/
│   └── SKILL.md
├── cxg-debug/
│   └── SKILL.md
├── cxg-optimize/
│   └── SKILL.md
├── cxg-test/
│   └── SKILL.md
├── cxg-review/
│   └── SKILL.md
├── cxg-enhance/
│   └── SKILL.md
├── cxg-commit/
│   └── SKILL.md
├── cxg-init/
│   └── SKILL.md
├── shared/
│   └── ...
├── tools/
│   └── ...
└── orchestration/
    └── ...
```

旧的根级 `templates/skills/SKILL.md` 总览 skill 不再作为主要用户入口。规范的用户入口是上面列出的 12 个顶层 `cxg-*` skills。

### 分层职责

#### 顶层入口 skills

这 12 个 `cxg-*` 目录应当作为 `templates/skills/` 的直接子目录，每个目录暴露一个顶层、用户可见的 skill。它们是用户应直接调用的唯一工作流入口。

每个顶层入口 skill 应包含：

- skill 的用途与适用场景
- 期望的输入形式
- 执行阶段或工作流约定
- 期望输出或交付格式
- 对共享规则或内部支撑 skills 的必要引用

每个顶层入口 skill 应避免：

- 重复大段共享规则块
- 内嵌本应属于 `tools/` 的工具实现细节
- 仅作为旧 prompt 文本的薄包装层

#### Shared skills 与共享资产

`templates/skills/shared/` 用于集中管理当前散落在多个 prompt 模板中的重复工作流规则，包括：

- 工作流阶段流转约定
- 子进程等待规则
- 用户确认检查点
- 共享输出格式指导
- 跨入口的交互策略

`shared/` 的目标是让顶层 skills 更易读、更易维护，同时保证 12 个入口之间的一致性。

#### Tool skills

`templates/skills/tools/` 继续作为质量关卡和实用型 skills 的归属位置，例如：

- `verify-change`
- `verify-module`
- `verify-quality`
- `verify-security`
- `gen-docs`

这些 skills 会被保留，并纳入新的信息架构统一整理，而不是被替换掉。

现有的 `run_skill.js` runner 仍然作为发布后的 skill 资产的一部分保留，但它的定位会调整为 tool-like workflows 的实现支撑，而不再是面向用户的工作流入口。它的具体放置位置可以继续留在 skills 根目录，也可以移动到更明确的 support 目录下，但迁移后它必须继续可用于工具型 skill 的执行。

#### Orchestration skills

`templates/skills/orchestration/` 继续承载 `multi-agent` 这类多智能体或协同逻辑。它们仍然是支撑能力，应由顶层 skills 或 tool skills 在需要时引用。

## 内容迁移策略

`templates/prompts/` 中的 prompt 模板会继续保留在仓库里，作为迁移期间的参考来源，但不再属于生产资产。

迁移策略如下：

1. 将每个旧 prompt 当作源材料，而不是最终 skill 内容。
2. 围绕 skills-native 的使用方式和结构，重写每个顶层 `SKILL.md`。
3. 将重复规则抽到 `shared/`，而不是复制到 12 个入口 skill 中。
4. 对现有 tool skills 和 orchestration skills 做重组，使其与新的结构和命名预期对齐。

该设计明确优先考虑清晰度和可维护性，而不是保留 prompt 时代的措辞。

## 安装与生命周期行为

### Installation

`init` 与 `installCxg()` 将切换到 `skills-only` 的用户入口模型。

安装产物包括：

- `~/.codex/skills/cxg/`
- `~/.codex/.cxg/roles/codex/`
- `~/.codex/.cxg/agents/codex/`
- `~/.codex/bin/codeagent-wrapper`

不再安装的产物包括：

- `~/.codex/prompts/cxg-*.md`

面向用户的安装输出应同步调整：

- 不再报告已安装的 custom prompts
- 改为报告已安装的顶层 skills 及支撑 skill 资产
- 使用 `$cxg-*` 调用示例替代 `/cxg-*`

### Update

`update` 不再将 `~/.codex/prompts/cxg-*.md` 视为受管资产。

更新时的备份和回滚范围仅包括：

- `~/.codex/skills/cxg`
- `~/.codex/.cxg`
- `~/.codex/bin/codeagent-wrapper`

关于 legacy prompts 的更新行为：

- 不删除已有的 `~/.codex/prompts/cxg-*.md`
- 不将这些文件的存在视为失败条件
- 可以输出一条非阻断提醒，说明这些文件是 legacy artifacts，已不再由 CXG 管理

### Uninstall

`uninstall` 只移除新版本仍然管理的资产：

- 已安装的 CXG skills
- 已安装的 CXG roles
- 已安装的 CXG agents
- 已安装的 wrapper binary
- 已安装的 CXG config

`uninstall` 不应删除 legacy 的 `~/.codex/prompts/cxg-*.md`。可以提示用户：如果希望完全清理 Codex home，可手动删除这些 legacy prompt 文件。

### Doctor

`doctor` 需要从 prompt-centric 的校验方式切换为 skill-centric 的校验方式。

健康检查通过的依据应包括：

- config 是否存在且可解析
- 12 个顶层 `cxg-*` skills 是否存在
- 必需的 `tools/` 资产是否存在
- 必需的 orchestration 资产是否存在
- roles 与 agent templates 是否存在
- wrapper binary 是否健康
- 当 MCP 启用时，其配置是否存在

legacy prompt 文件只能作为 informational 或 warning 级别信号展示，不能导致 doctor 失败。

## 配置模型

### 当前配置存在的问题

当前 config schema 仍然带有明显的 prompt 时代痕迹：

- `paths.prompts`
- `commands.installed`

在迁移后，这两个字段都会变得具有误导性，因为实际的运行时入口已经变成了 skills，而不是 prompt 文件。

### 目标配置形态

config schema 应演进为：

- 移除 `paths.prompts`
- 将 `commands.installed` 替换为 `skills.installed`

最终受管路径应包括：

- `paths.skills`
- `paths.roles`
- `paths.agents`
- `paths.wrapper`

这样才能让持久化的 config 与真实受管资产保持一致。

### 兼容规则

对已有用户的 config 需要提供向后兼容。

规则如下：

- 读取 config 时必须容忍 legacy 的 `paths.prompts`
- 读取 config 时必须容忍 legacy 的 `commands.installed`
- 任何新的写入路径，例如 `init --force`、`update` 或 config rewrite，都应写出新结构
- `menu`、`doctor` 等消费方在读取时应优先使用 `skills.installed`，若不存在则回退到 `commands.installed`

这样可以安全地原地演进配置结构，而不需要额外设计一次性迁移命令。

## Packaging 变更

`package.json` 不再发布 `templates/prompts/`。

发布资产应包括：

- `templates/skills/`
- `templates/roles/`
- `templates/commands/`
- 编译后的运行时代码

`templates/prompts/` 仅保留在仓库中，作为维护者的源参考材料。

## 文档变更

中英文 README 都需要更新，以反映 skills-native 模型。

必要的文档调整包括：

- 将 `/cxg-*` 示例替换为 `$cxg-*`
- 删除“CXG 会将 prompt 文件安装到 `~/.codex/prompts/`”这类表述
- 将系统描述为“顶层 Codex skills + supporting roles + agents”
- 更新文件树示例，展示新的 skills 布局
- 调整 install、upgrade、uninstall、doctor 的行为说明

文档需要明确说明：

- CXG 不再依赖 custom prompts
- 用户升级后，机器上可能仍然保留 legacy prompt 文件
- 新版本只管理 skills-native 这一套资产

## 测试策略

测试套件需要从 prompt 完整性检查转向 skill 完整性检查。

### Installer 与资产完整性测试

将基于 prompt 的断言替换为：

- 12 个顶层 `cxg-*` skill 目录必须存在
- 每个顶层 skill 都必须包含一个 `SKILL.md`
- 必需的 `tools/` 资产必须存在
- 必需的 orchestration 资产必须存在
- 必需的 role 与 agent templates 必须继续存在

### Template variable 测试

仍然保留对 markdown 类模板在变量注入后不得残留未解析占位符的校验，但要将新的 skill 文件集合视为主要校验面。

### Config 测试

新增或调整以下测试：

- 默认 config 不再包含 `paths.prompts`
- 默认 config 会初始化 `skills.installed`
- legacy config 结构仍然可以安全读取
- 消费方可以从 `skills.installed` 正确回退到 `commands.installed`

### Doctor 行为测试

新增或调整以下测试：

- 缺失顶层 skills 会导致失败
- 缺失 tool 资产会导致失败
- 存在 legacy prompt 文件不会导致失败

### Package manifest 与文档检查

在可行范围内增加断言：

- `package.json` 不再发布 `templates/prompts/`
- README 示例与措辞不再描述 `/cxg-*` prompt 用法

## 实施范围

本次实现预计至少会涉及：

- `templates/skills/`
- `package.json`
- `src/utils/installer.ts`
- `src/utils/config.ts`
- `src/types/index.ts`
- `src/commands/init.ts`
- `src/commands/update.ts`
- `src/commands/uninstall.ts`
- `src/commands/doctor.ts`
- `src/commands/menu.ts`
- `src/utils/__tests__/installer.test.ts`
- `src/utils/__tests__/template.test.ts`
- `src/utils/__tests__/config.test.ts`
- README 文件

## Rollout 原则

- 仓库在一段时间内可以同时存在 `templates/prompts/` 和 `templates/skills/`，但只有 skills 继续作为发布与安装后的工作流主入口。
- 对用户升级过程要保持非破坏性，尤其是不主动处理 legacy prompt 文件。
- 新代码应将 skills 视为唯一受管的用户入口机制。
- 迁移设计优先考虑长期清晰的结构，而不是保留 prompt 时代的实现细节。

## 验收标准

当以下条件全部满足时，可认为迁移完成：

- CXG 发布并安装的是顶层 `$cxg-*` skills，而不是 `/cxg-*` prompt 文件
- 12 个工作流入口都以顶层、用户可见的 skill 形式存在
- 现有 tool skills 与 orchestration skills 都已纳入新结构
- installer、update、uninstall、doctor、config、docs 都将系统表述为 skills-native
- legacy prompt 文件不再被安装或受管，但它们的存在不会破坏更新与诊断流程
- 仓库仍然保留旧的 prompt 模板，仅作为迁移参考材料
