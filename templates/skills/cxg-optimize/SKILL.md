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
