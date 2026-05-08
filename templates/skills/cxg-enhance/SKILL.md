---
name: cxg-enhance
description: Refine a rough request into a structured task brief without changing the user's intent.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-enhance

Use this skill when the user's request is underspecified and would benefit from a clearer brief before execution.

## Purpose

- Turn ambiguous input into an actionable task description.
- Preserve the user's goal while making scope, constraints, and acceptance criteria explicit.

## Expected Input

- A raw request, short idea, or loosely scoped task.
- Optional context such as target files, technical stack, deadlines, or quality expectations.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Extract the intended outcome, constraints, and missing information.
2. Inspect the repository only as needed to ground the request in real code and conventions.
3. Rewrite the task in a structured format with goals, boundaries, and validation signals.
4. Highlight any uncertainty that still needs user confirmation.
5. Do not implement the work unless the user explicitly changes the task from enhancement to execution.

## Deliverable

- An enhanced task brief ready for `$cxg-plan`, `$cxg-execute`, or another `$cxg-*` skill.
- A short list of any remaining open questions.
