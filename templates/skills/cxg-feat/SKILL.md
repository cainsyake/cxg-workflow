---
name: cxg-feat
description: Develop a feature from request shaping through implementation and handoff.
license: MIT
user-invocable: true
disable-model-invocation: false
---

# $cxg-feat

Use this skill when the user asks for new functionality and expects you to carry it through to delivery.

## Purpose

- Shape a feature request into an implementable scope.
- Coordinate planning, implementation, and validation for new functionality.

## Expected Input

- A feature description, enhancement request, or user story.
- Optional UX, API, performance, or compatibility constraints.

## Shared Guidance

- Workflow rules: `../shared/workflow-rules.md`
- Interaction checkpoints: `../shared/interaction-checkpoints.md`
- Output contracts: `../shared/output-contracts.md`

## Workflow

1. Clarify the feature outcome, boundaries, and success criteria.
2. Inspect current patterns and identify the modules the feature touches.
3. Produce a lightweight plan if the request is not already implementation-ready.
4. Implement incrementally, adding or updating tests as behavior changes.
5. Verify the new feature and summarize any tradeoffs or future extensions.

## Deliverable

- A shipped or implementation-ready feature slice.
- Notes on validation, remaining gaps, and suggested next iteration if relevant.
