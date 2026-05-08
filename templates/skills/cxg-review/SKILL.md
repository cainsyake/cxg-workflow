---
name: cxg-review
description: Review changes for correctness, regressions, risk, and missing validation with findings-first output.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-review

Use this skill when the user wants a code review or a quality gate on a set of changes.

## Purpose

- Evaluate change risk before merge or release.
- Prioritize concrete findings over general commentary.

## Expected Input

- A diff, branch, file path, or request to review current workspace changes.
- Optional focus areas such as security, performance, testing, or API behavior.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Identify the review scope and gather the relevant diff and context.
2. Inspect for functional bugs, regressions, risky assumptions, and missing tests first.
3. Order findings by severity and include file references.
4. State clearly when no findings are present, along with residual risk or coverage gaps.
5. Keep summaries brief and secondary to the findings.

## Deliverable

- Findings-first review output with severity ordering.
- Open questions, assumptions, and concise overall assessment.
