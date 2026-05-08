---
name: cxg-analyze
description: Investigate a codebase question or task deeply without changing product code.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-analyze

Use this skill when the user wants understanding, not edits.

## Purpose

- Gather evidence from the repository and explain how a system currently works.
- Surface constraints, risks, and likely implementation paths without making code changes.

## Expected Input

- A question, investigation target, architecture concern, or decision point.
- Optional file paths, symbols, error messages, or constraints to focus the analysis.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Define the question precisely and list the signals needed to answer it.
2. Inspect the relevant code, tests, configuration, and documentation.
3. Separate observed behavior from inference and highlight confidence level.
4. If useful, compare 2-3 implementation or remediation options with tradeoffs.
5. Stay read-only unless the user explicitly changes the task.

## Deliverable

- Findings with file references.
- Assumptions, risks, and recommended next actions.
