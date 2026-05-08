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

- 项目摘要、上手目标，或刷新 AGENTS.md 风格上下文的请求。
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
