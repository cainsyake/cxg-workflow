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

- 当前工作区改动，可选地附带 --all、--amend 或期望的 type/scope。
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
