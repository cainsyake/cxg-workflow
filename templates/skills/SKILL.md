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
新模块：     gen-docs -> 实施 -> verify-module -> verify-security
代码变更：   实施 -> verify-change -> verify-quality
安全任务：   执行 -> verify-security
重构任务：   重构 -> verify-change -> verify-quality -> verify-security
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
