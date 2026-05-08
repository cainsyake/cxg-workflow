# Workflow Rules

These rules apply to every `$cxg-*` skill unless a skill explicitly narrows the scope.

## Core Principles

1. Stay within the user-approved scope. Do not widen the task without stating why.
2. Prefer repository evidence over assumption. Read relevant files before concluding.
3. Keep outputs actionable. Every recommendation should map to a next step, file, or command.
4. Preserve existing user work. Never revert unrelated changes.
5. Match the repository's conventions for formatting, naming, testing, and commit hygiene.

## Execution Discipline

1. Start by restating the goal, constraints, and any assumption you must make.
2. Inspect the current workspace before proposing or making changes.
3. Use the minimal workflow that can safely complete the task.
4. If a task implies code changes, testing, or review, say which checks will prove success.
5. When the task is implementation-oriented, prefer a test-first or verification-first loop.

## Scope Boundaries

1. Treat any legacy prompt templates or repository-only scaffolding as optional reference material when a skill needs historical context.
2. Limit direct edits to the files required by the active task.
3. If the workspace contains concurrent edits, adapt to them instead of overwriting them.
4. Escalate only when a decision has meaningful product, architecture, or workflow impact.

## Decision Rules

1. Ask for clarification only when the ambiguity changes the implementation path.
2. If several valid paths exist, recommend one and explain the tradeoff briefly.
3. If a requested action cannot be verified, state the gap and the closest safe outcome.
