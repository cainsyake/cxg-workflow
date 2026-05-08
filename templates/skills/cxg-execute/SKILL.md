---
name: cxg-execute
description: Execute an approved plan, apply the required code or content changes, and verify the result.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-execute

Use this skill when a task already has an agreed direction and needs focused implementation.

## Purpose

- Turn an approved plan or explicit task into working repository changes.
- Keep edits scoped, reviewable, and verified before completion is reported.

## Expected Input

- A plan file path, approved checklist, or direct implementation request.
- Optional guardrails such as files to avoid, tests to run, or commit expectations.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Reconfirm the execution scope and identify the proof of completion.
2. Inspect the current implementation and write or update tests when behavior changes.
3. Apply the smallest complete set of edits needed to satisfy the request.
4. Run the targeted verification commands and fix failures before moving on.
5. Summarize what changed, what was verified, and any follow-up the user should know about.

## Deliverable

- The implemented changes.
- Verification results tied to the executed plan or task request.
