---
name: cxg-optimize
description: Analyze bottlenecks and implement high-value optimizations with measurable verification.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-optimize

Use this skill when the user wants better performance, lower cost, or simpler high-traffic execution paths.

## Purpose

- Find the bottleneck that matters most.
- Prioritize improvements by expected benefit, cost, and regression risk.

## Expected Input

- An optimization target such as latency, throughput, bundle size, or resource usage.
- Optional baselines, profiling data, SLAs, or files suspected to be hot paths.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Define the optimization metric and current baseline.
2. Inspect the relevant implementation, instrumentation, and tests.
3. Identify the highest-leverage opportunities and explain tradeoffs.
4. Apply approved optimizations with minimal functional risk.
5. Re-measure with the best available verification command or benchmark.

## Deliverable

- A prioritized optimization summary.
- Implemented changes and before/after verification when measurable.
