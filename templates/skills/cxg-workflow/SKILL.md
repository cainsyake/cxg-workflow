---
name: cxg-workflow
description: End-to-end structured workflow for researching, planning, implementing, optimizing, and reviewing a development task.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-workflow

Use this skill when the user wants one orchestrated workflow that carries a task from discovery through delivery.

## Purpose

- Coordinate the full development lifecycle for a single task.
- Route into focused `$cxg-*` skills when the work benefits from narrower treatment.
- Keep progress gated by evidence, user confirmation, and verification.

## Expected Input

- A task description, feature request, bug report, or change objective.
- Optional constraints such as deadlines, file boundaries, testing requirements, or implementation preferences.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Restate the goal, scope, and assumptions.
2. Inspect the repository context and decide whether the task is analysis, planning, implementation, optimization, or review heavy.
3. Run the phases in order: research, concept shaping, planning, execution, optimization, review.
4. Pause for user confirmation after major phase transitions or when tradeoffs become material.
5. Verify the final state with the commands that match the work performed.

## Deliverable

- A concise phase-by-phase summary of what was learned and done.
- The implemented or proposed next step for each phase.
- Verification evidence and any residual risks.
