# CXG Workflow Skills-Native Migration Design

## Summary

CXG Workflow currently installs 12 `/cxg-*` custom prompts into `~/.codex/prompts/` and separately installs a small set of skills into `~/.codex/skills/cxg/`. New Codex versions no longer support the `/cxg-*` custom prompt invocation model. CXG therefore needs to migrate from a prompt-centered distribution model to a skills-native model built around explicit `$cxg-*` skill invocation.

This design keeps the 12 existing workflow entrypoints conceptually intact, but reintroduces them as top-level user-visible skills:

- `$cxg-workflow`
- `$cxg-plan`
- `$cxg-execute`
- `$cxg-feat`
- `$cxg-analyze`
- `$cxg-debug`
- `$cxg-optimize`
- `$cxg-test`
- `$cxg-review`
- `$cxg-enhance`
- `$cxg-commit`
- `$cxg-init`

The migration is intentionally not a mechanical prompt-to-skill conversion. The new implementation will restructure the entire `templates/skills/` tree to better match Codex skills conventions, explicitly favor user-invoked skills, and reduce repeated workflow instructions through shared assets.

## Goals

- Replace `/cxg-*` custom prompt usage with explicit `$cxg-*` skill usage.
- Preserve the current 12 workflow entrypoints as a one-to-one top-level skill surface.
- Rebuild the CXG distribution model as `skills-only` for user-facing workflow entrypoints.
- Unify and modernize the existing `templates/skills/` tree instead of only adding 12 wrapper skills.
- Keep old `templates/prompts/` in the repository as migration reference material, but stop publishing and installing them.
- Avoid destructive migration behavior on user machines by not deleting legacy `~/.codex/prompts/cxg-*.md` files.

## Non-Goals

- Maintaining `/cxg-*` runtime compatibility in new Codex versions.
- Preserving prompt-era implementation structure when it conflicts with a cleaner skills-native design.
- Automatically cleaning up legacy prompt files from user installations.
- Redesigning the semantic purpose of the 12 workflow entrypoints.

## User Experience

### Invocation Model

Users will explicitly invoke top-level skills with `$cxg-*` names. The intended primary mode is direct invocation by name, not auto-selection by Codex.

Examples:

```text
$cxg-workflow implement invoice export with audit logging
$cxg-plan refactor payment service
$cxg-review
```

### Behavior Expectations

- Each top-level skill should remain recognizable to existing CXG users.
- The names and broad responsibilities of the 12 entrypoints remain stable.
- Internal workflow content may be rewritten to better fit skills semantics.
- Tooling and orchestration skills continue to exist, but mostly as supporting assets rather than the primary user-facing interface.

## Repository Structure

### Current State

- `templates/prompts/` contains the 12 user-facing workflow prompt files.
- `templates/skills/` contains a root `cxg-skills` skill, `run_skill.js`, tool-like skills, and orchestration helpers.
- Installer logic treats prompt files as the primary command surface and skills as a secondary asset group.

### Target State

`templates/skills/` becomes the canonical workflow surface and is reorganized into four layers:

```text
templates/skills/
├── cxg-workflow/
│   └── SKILL.md
├── cxg-plan/
│   └── SKILL.md
├── cxg-execute/
│   └── SKILL.md
├── cxg-feat/
│   └── SKILL.md
├── cxg-analyze/
│   └── SKILL.md
├── cxg-debug/
│   └── SKILL.md
├── cxg-optimize/
│   └── SKILL.md
├── cxg-test/
│   └── SKILL.md
├── cxg-review/
│   └── SKILL.md
├── cxg-enhance/
│   └── SKILL.md
├── cxg-commit/
│   └── SKILL.md
├── cxg-init/
│   └── SKILL.md
├── shared/
│   └── ...
├── tools/
│   └── ...
└── orchestration/
    └── ...
```

The old root `templates/skills/SKILL.md` overview skill is removed as the primary user entrypoint. The canonical user-facing entrypoints are the 12 top-level `cxg-*` skills listed above.

### Layer Responsibilities

#### Top-Level Entry Skills

The 12 `cxg-*` directories are immediate children of `templates/skills/` and each exposes one top-level user-visible skill. These are the only workflow entrypoints users are expected to invoke directly.

Each top-level entry skill should contain:

- the skill purpose and when to use it
- the expected input format
- the execution stages or workflow contract
- the required outputs or deliverable format
- references to shared rules or internal supporting skills where appropriate

Each top-level entry skill should avoid:

- duplicating large shared rule blocks
- embedding tool implementation details that belong in `tools/`
- acting as a thin wrapper around the old prompt text

#### Shared Skills and Shared Assets

`templates/skills/shared/` will centralize repeated workflow rules currently duplicated across prompt templates. This includes:

- workflow stage transition conventions
- subprocess waiting rules
- user confirmation checkpoints
- shared output formatting guidance
- cross-cutting interaction policies

The purpose of `shared/` is to keep top-level skills readable and maintainable while ensuring consistency across the 12 entrypoints.

#### Tool Skills

`templates/skills/tools/` remains the home for quality-gate and utility skills such as:

- `verify-change`
- `verify-module`
- `verify-quality`
- `verify-security`
- `gen-docs`

These skills are retained and refactored into the new information architecture rather than replaced.

The existing `run_skill.js` runner remains part of the published skill asset set, but it is treated as implementation support for tool-like workflows rather than as a user-facing workflow entrypoint. Its exact placement may remain at the skills root or move under a more explicit support location, but it must continue to function for tool skill execution after the migration.

#### Orchestration Skills

`templates/skills/orchestration/` continues to host multi-agent or coordination logic such as `multi-agent`. These remain supporting capabilities and should be referenced by top-level skills or tools when needed.

## Content Migration Strategy

The prompt templates in `templates/prompts/` remain in the repository as a reference source during migration, but they stop being production assets.

The migration strategy is:

1. Treat each old prompt as source material, not as final skill content.
2. Rewrite each top-level `SKILL.md` around skills-native usage and structure.
3. Extract repeated rules into `shared/` instead of copying them into all 12 entry skills.
4. Reorganize existing tool and orchestration skills to align with the new structure and naming expectations.

This design deliberately favors clarity and maintainability over preserving prompt-era wording.

## Installation and Lifecycle Behavior

### Installation

`init` and `installCxg()` will move to a `skills-only` user-entrypoint model.

Installed assets will be:

- `~/.codex/skills/cxg/`
- `~/.codex/.cxg/roles/codex/`
- `~/.codex/.cxg/agents/codex/`
- `~/.codex/bin/codeagent-wrapper`

Assets that will no longer be installed:

- `~/.codex/prompts/cxg-*.md`

User-facing install output should change accordingly:

- stop reporting installed custom prompts
- report installed top-level skills and supporting skill assets
- show `$cxg-*` invocation examples instead of `/cxg-*`

### Update

`update` should stop treating `~/.codex/prompts/cxg-*.md` as managed assets.

Update backup and rollback scope should only include:

- `~/.codex/skills/cxg`
- `~/.codex/.cxg`
- `~/.codex/bin/codeagent-wrapper`

Update behavior regarding legacy prompts:

- do not delete legacy `~/.codex/prompts/cxg-*.md`
- do not treat their existence as a failure condition
- optionally warn that they are legacy artifacts no longer managed by CXG

### Uninstall

`uninstall` should remove only assets still managed by the new version:

- installed CXG skills
- installed CXG roles
- installed CXG agents
- installed wrapper binary
- installed CXG config

`uninstall` should not delete legacy `~/.codex/prompts/cxg-*.md` files. It may print a reminder that these legacy prompt files can be removed manually if the user wants a fully clean Codex home.

### Doctor

`doctor` should switch from prompt-centric validation to skill-centric validation.

Passing health checks should be based on:

- config existence and parseability
- presence of the 12 top-level `cxg-*` skills
- presence of required `tools/` assets
- presence of required orchestration assets
- presence of roles and agent templates
- wrapper binary health
- MCP configuration when enabled

Legacy prompt files should be reported only as informational or warning-level signals and should not make doctor fail.

## Configuration Model

### Problems in the Current Config

The current config schema still reflects the prompt era:

- `paths.prompts`
- `commands.installed`

Both become misleading after the migration because the new runtime surface is skills, not prompt files.

### Target Config Shape

The config schema should evolve to:

- remove `paths.prompts`
- replace `commands.installed` with `skills.installed`

The target managed paths are:

- `paths.skills`
- `paths.roles`
- `paths.agents`
- `paths.wrapper`

This keeps the stored config aligned with the actual managed assets.

### Compatibility Rules

Backward compatibility is required for users with existing config files.

Rules:

- Reading config must tolerate legacy `paths.prompts`.
- Reading config must tolerate legacy `commands.installed`.
- Any new write path such as `init --force`, `update`, or config rewrite should write the new config structure.
- Consumers such as menu and doctor should prefer `skills.installed` and fall back to `commands.installed` when reading older configs.

This provides safe in-place evolution without a one-off migration command.

## Packaging Changes

`package.json` should stop publishing `templates/prompts/`.

Published assets should include:

- `templates/skills/`
- `templates/roles/`
- `templates/commands/`
- compiled runtime files

`templates/prompts/` remains in the repository only as source reference for maintainers.

## Documentation Changes

The English and Chinese README files must be updated to reflect the skills-native model.

Required documentation updates:

- replace `/cxg-*` examples with `$cxg-*`
- remove statements that CXG installs prompt files into `~/.codex/prompts/`
- describe the system as top-level Codex skills plus supporting roles and agents
- update file tree examples to show the new skills layout
- adjust install, upgrade, uninstall, and doctor behavior descriptions

Documentation should clearly explain that:

- CXG no longer depends on custom prompts
- legacy prompt files may still exist on a user machine after upgrade
- new versions manage only the skills-native asset set

## Testing Strategy

The test suite should be updated from prompt completeness checks to skill completeness checks.

### Installer and Asset Completeness Tests

Replace prompt-based assertions with:

- the 12 top-level `cxg-*` skill directories must exist
- each top-level skill must contain a `SKILL.md`
- required `tools/` assets must exist
- required orchestration assets must exist
- required role and agent templates must still exist

### Template Variable Tests

Continue validating that all published markdown-based templates render without unresolved variables after injection, but use the new set of skill files as the primary surface.

### Config Tests

Add or update tests for:

- default config no longer contains `paths.prompts`
- default config initializes `skills.installed`
- legacy config shapes can still be read safely
- consumers correctly fall back from `skills.installed` to `commands.installed`

### Doctor Behavior Tests

Add or update tests so that:

- missing top-level skills cause failure
- missing tool assets cause failure
- presence of legacy prompt files does not cause failure

### Package Manifest and Docs Checks

Add assertions where practical that:

- `package.json` no longer publishes `templates/prompts/`
- README examples and wording no longer describe `/cxg-*` prompt usage

## Implementation Scope

The implementation is expected to touch at least:

- `templates/skills/`
- `package.json`
- `src/utils/installer.ts`
- `src/utils/config.ts`
- `src/types/index.ts`
- `src/commands/init.ts`
- `src/commands/update.ts`
- `src/commands/uninstall.ts`
- `src/commands/doctor.ts`
- `src/commands/menu.ts`
- `src/utils/__tests__/installer.test.ts`
- `src/utils/__tests__/template.test.ts`
- `src/utils/__tests__/config.test.ts`
- README files

## Rollout Principles

- The repository may temporarily contain both `templates/prompts/` and `templates/skills/`, but only skills remain part of the published and installed workflow surface.
- User upgrades should be non-destructive with respect to legacy prompt files.
- New code should treat skills as the sole managed user-entrypoint mechanism.
- The migration should prioritize a coherent long-term structure over preserving prompt-era implementation details.

## Acceptance Criteria

The migration is complete when all of the following are true:

- CXG publishes and installs top-level `$cxg-*` skills instead of `/cxg-*` prompt files.
- All 12 workflow entrypoints exist as top-level user-visible skills.
- Existing tool and orchestration skills are integrated into the new structure.
- Installer, update, uninstall, doctor, config, and docs all describe the system as skills-native.
- Legacy prompt files are no longer installed or managed, but their presence does not break updates or diagnostics.
- The repository still keeps old prompt templates only as migration reference material.
