---
name: cxg-plan
description: Create an implementation-ready plan for a repository task without modifying product code.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-plan

Use this skill when the user wants a concrete execution plan before code changes begin.

## Purpose

- Translate a request into an implementation plan with clear scope and validation steps.
- Keep the session read-only except for plan artifacts the user explicitly requests.

## Expected Input

- A task description, feature request, migration step, or plan file update request.
- Optional constraints such as target files, sequencing, ownership boundaries, or testing expectations.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Confirm the goal, non-goals, and any missing constraints.
2. Inspect the relevant files, tests, and repository conventions.
3. Break the work into ordered steps with touched files and verification commands.
4. Call out dependencies, risky decisions, and any prerequisite user approvals.
5. Keep the plan implementation-ready and avoid modifying product code while planning.

## Deliverable

- A sequenced plan with file targets, tests, and acceptance checks.
- A short risk register or list of open questions if anything blocks execution.
