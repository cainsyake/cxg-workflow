---
name: cxg-test
description: Design and add targeted test coverage aligned with the repository's existing test strategy.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-test

Use this skill when the user wants new tests, stronger coverage, or help validating a risky area.

## Purpose

- Expand confidence with focused tests that match project conventions.
- Cover important behavior, edge cases, and regressions without inventing a parallel test style.

## Expected Input

- A feature area, bug fix, file path, function, or acceptance scenario to test.
- Optional constraints such as framework, speed, fixtures, or coverage priorities.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Inspect the target code and the surrounding test patterns.
2. Identify the most valuable scenarios: happy path, edge cases, failure paths, regressions.
3. Add or update tests in the existing framework and naming conventions.
4. Run the narrowest useful test command first, then broader checks if needed.
5. Report what is now covered and what still is not.

## Deliverable

- New or updated tests.
- A short coverage summary and the verification results.
