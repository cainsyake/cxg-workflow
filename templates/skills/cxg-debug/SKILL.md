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
