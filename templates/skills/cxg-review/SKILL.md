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
