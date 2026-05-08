---
name: cxg-init
description: Initialize or refresh repository context artifacts such as AGENTS.md and related guidance docs.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-init

Use this skill when the user wants project context scaffolding or documentation refreshed for agentic work.

## Purpose

- Generate or update high-signal repository guidance artifacts.
- Keep documentation aligned with the current module structure and workflow expectations.

## Expected Input

- A project summary, onboarding goal, or request to refresh `AGENTS.md`-style context.
- Optional boundaries such as directories to include, ignore, or document more deeply.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Inspect the repository structure, important entrypoints, and existing guidance docs.
2. Decide which context artifacts should be created or updated.
3. Draft concise root guidance and more detailed module-level guidance where needed.
4. Keep edits documentation-only unless the user explicitly asks for code changes too.
5. Verify the generated files are internally consistent and easy to navigate.

## Deliverable

- New or updated repository context documents.
- A short summary of coverage, skipped areas, and recommended follow-up.
