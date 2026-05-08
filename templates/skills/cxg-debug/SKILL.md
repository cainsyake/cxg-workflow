---
name: cxg-debug
description: Reproduce, diagnose, and fix a defect with evidence-driven debugging.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-debug

Use this skill when the user reports broken behavior, failing tests, or runtime errors.

## Purpose

- Move from symptom to verified root cause.
- Apply the smallest safe fix and prove the issue is resolved.

## Expected Input

- A bug report, failing command, stack trace, or reproduction description.
- Optional scope limits, regression concerns, or affected environments.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Restate the symptom and identify how to reproduce or observe it.
2. Inspect the relevant code paths, tests, logs, and recent changes.
3. Form root-cause hypotheses and validate them against evidence.
4. Add or update regression coverage before or alongside the fix when behavior changes.
5. Verify the fix with the reproduction path and targeted tests.

## Deliverable

- The confirmed root cause.
- The fix, regression coverage, and verification evidence.
