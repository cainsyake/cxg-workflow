---
name: cxg-commit
description: Prepare a focused Conventional Commit from the current repository changes.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-commit

Use this skill when the user wants help staging, scoping, and committing the current work.

## Purpose

- Summarize the change set accurately.
- Produce a Conventional Commit message that matches repository history and scope.

## Expected Input

- The current workspace changes, optionally with flags like `--all`, `--amend`, or a desired type/scope.
- Optional instructions about staging boundaries or hook behavior.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Inspect git status, staged changes, and unstaged changes.
2. Decide whether the work is one coherent commit or should be split.
3. Recommend a Conventional Commit type and scope based on the actual diff.
4. If the user wants execution, stage only the intended files and create the commit non-interactively.
5. Report the final commit message and any scope caveats.

## Deliverable

- A focused Conventional Commit recommendation or an actual commit.
- Clear note of what was staged, what was excluded, and the resulting SHA when committed.
