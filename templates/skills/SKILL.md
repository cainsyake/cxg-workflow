---
name: cxg-skills
description: CXG Skills - workflow entrypoints, shared guidance, quality gates, and orchestration assets. Auto-installed by CXG workflow system.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# CXG Skills

## Directory Structure

```
skills/
├── cxg-workflow/          # End-to-end workflow entrypoint
├── cxg-plan/              # Planning entrypoint
├── cxg-execute/           # Execution entrypoint
├── cxg-feat/              # Feature delivery entrypoint
├── cxg-analyze/           # Read-only analysis entrypoint
├── cxg-debug/             # Debugging entrypoint
├── cxg-optimize/          # Optimization entrypoint
├── cxg-test/              # Testing entrypoint
├── cxg-review/            # Review entrypoint
├── cxg-enhance/           # Task-brief enhancement entrypoint
├── cxg-commit/            # Commit preparation entrypoint
├── cxg-init/              # Context bootstrap entrypoint
├── shared/                # Reusable workflow rules and output contracts
├── tools/                 # Quality gates and generators
│   ├── verify-security/
│   ├── verify-quality/
│   ├── verify-change/
│   ├── verify-module/
│   ├── gen-docs/
│   └── lib/
├── orchestration/         # Coordination helpers
│   └── multi-agent/
├── run_skill.js           # Helper runner for tool-like workflows under tools/
└── SKILL.md               # This file
```

## Quick Navigation

| Category | Description | Entry |
|----------|-------------|-------|
| **Workflow Entry Points** | User-invocable `$cxg-*` skills for planning, execution, analysis, and delivery | [Workflow Skills](#workflow-skills) |
| **Shared Guidance** | Reusable workflow rules, checkpoints, and output contracts | [Shared Guidance](#shared-guidance) |
| **Quality Gates** | Module completeness, security, quality, and change validation | [Quality Gates](#quality-gates) |
| **Orchestration** | Multi-agent coordination and task decomposition support | [Multi-Agent](#multi-agent-orchestration) |

---

## Workflow Skills

These are the user-facing skill entrypoints. Refer to them as `$cxg-*` skills, not prompt commands.

| Skill | Primary Use |
|-------|-------------|
| `$cxg-workflow` | Run a task through research, planning, execution, optimization, and review |
| `$cxg-plan` | Produce an implementation plan without modifying product code |
| `$cxg-execute` | Execute an approved plan and verify the result |
| `$cxg-feat` | Deliver a new feature from shaping through validation |
| `$cxg-analyze` | Investigate how the codebase works without making changes |
| `$cxg-debug` | Diagnose and fix a defect with regression proof |
| `$cxg-optimize` | Improve performance or efficiency with measurable validation |
| `$cxg-test` | Add or strengthen test coverage |
| `$cxg-review` | Review changes for correctness, regressions, and risk |
| `$cxg-enhance` | Rewrite a rough request into a structured task brief |
| `$cxg-commit` | Prepare or perform a focused Conventional Commit |
| `$cxg-init` | Initialize or refresh agent-facing repository guidance |

## Shared Guidance

Shared markdown assets keep the workflow entrypoints consistent:

- `shared/workflow-rules.md` defines execution discipline, scope control, and decision rules.
- `shared/interaction-checkpoints.md` defines progress updates, escalation points, and verification checkpoints.
- `shared/output-contracts.md` defines the expected shape and quality bar of skill outputs.

## Quality Gates

**Mandatory quality checkpoints to ensure deliverable standards.**

| Skill | Trigger | Description |
|-------|---------|-------------|
| `verify-module` | New module completed | Module structure and documentation completeness |
| `verify-security` | New module, security changes, refactoring | Security vulnerability scanning |
| `verify-change` | Design-level changes, refactoring | Change analysis and documentation sync |
| `verify-quality` | Complex modules, refactoring | Code quality metrics checking |
| `gen-docs` | New module created | README.md and DESIGN.md skeleton generator |

### Auto-trigger Rules

```
New module:     gen-docs -> implementation -> verify-module -> verify-security
Code changes:   implementation -> verify-change -> verify-quality
Security tasks: execution -> verify-security
Refactoring:    refactor -> verify-change -> verify-quality -> verify-security
```

### Running Skills

The top-level `$cxg-*` entrypoints are invoked as skills in the host environment. `run_skill.js` is only the helper runner for tool-oriented workflows such as `verify-security`, `verify-quality`, `verify-change`, `verify-module`, and `gen-docs`.

```bash
# Tool workflow runner
node ~/.codex/skills/cxg/run_skill.js <skill-name> [args...]

# Examples for tools/ skills
node ~/.codex/skills/cxg/run_skill.js verify-security ./src
node ~/.codex/skills/cxg/run_skill.js verify-quality ./src -v
node ~/.codex/skills/cxg/run_skill.js verify-change --mode staged
node ~/.codex/skills/cxg/run_skill.js verify-module ./my-module
node ~/.codex/skills/cxg/run_skill.js gen-docs ./new-module --force
```

---

## Multi-Agent Orchestration

| Skill | Trigger | Description |
|-------|---------|-------------|
| `multi-agent` | TeamCreate, parallel tasks, multi-agent | Ant colony-inspired multi-agent coordination |

Provides:
- Agent role system (Lead/Scout/Worker/Soldier/Drone)
- Pheromone-based indirect communication
- File ownership locking & conflict avoidance
- Adaptive concurrency control
- TeamCreate vs single-agent decision tree

---

## Installed by CXG

These skills are automatically installed during `npx cxg-workflow init`.
To update: run `npx cxg-workflow update` or `npx cxg-workflow init --force`.
