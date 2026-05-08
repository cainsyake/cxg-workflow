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

- 一份可直接交给 $cxg-plan、$cxg-execute 或其他 $cxg-* 技能使用的增强任务简报。
- 一份简短的待确认问题列表。
