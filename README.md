# CXG - Codex Single-Model Structured Workflow

<div align="center">

English | [简体中文](./README.zh-CN.md)

</div>

CXG is a Codex-first workflow package for Codex CLI. It installs a structured set of slash commands, skills, role prompts, and a `codeagent-wrapper` binary so Codex can handle research, planning, execution, optimization, and review in a consistent single-model workflow.

## Why CXG?

- **Single-model by design**: no routing between different models, only Codex orchestration plus Codex subprocess roles.
- **Structured delivery**: the main workflow follows `research -> plan -> execute -> optimize -> review`.
- **Reusable expert roles**: built-in `analyzer`, `architect`, and `reviewer` role prompts drive subprocess work.
- **Optional code retrieval**: supports `ace-tool`, can be prepared for `contextweaver`, and falls back to `Glob + Grep` when MCP is skipped.
- **Ready-to-use slash commands**: installs 12 commands directly into `~/.codex/prompts/`.

## Architecture

```text
Codex CLI
   |
   +-- /cxg-* custom prompts
   |
   +-- skills/cxg/*
   |
   +-- codeagent-wrapper
          |
          +-- Codex subprocess (analyzer / architect / reviewer)
```

The main Codex session orchestrates the workflow. Subprocesses are used for focused analysis, planning, and review, then their output is fed back into the main session.

## Quick Start

### Prerequisites

| Dependency | Required | Notes |
|------------|----------|-------|
| Node.js | Yes | Node.js 18+ recommended for modern ESM and built-in `fetch` |
| Codex CLI | Yes | CXG installs commands into `~/.codex/` for Codex CLI to use |
| GitHub Releases access | Yes | `init` downloads `codeagent-wrapper` during installation |
| ace-tool | No | Optional MCP retrieval provider |
| ContextWeaver | No | Optional MCP retrieval provider, requires manual setup |

### Installation

```bash
npx cxg-workflow init
```

Useful variants:

```bash
# overwrite existing CXG files
npx cxg-workflow init --force

# install without WebUI-related wrapper behavior
npx cxg-workflow init --lite

# configure ace-tool in ~/.codex/config.toml
npx cxg-workflow init --mcp ace-tool

# skip MCP and use filesystem search fallback
npx cxg-workflow init --skip-mcp
```

After installation, open Codex CLI and invoke commands as slash commands such as:

```bash
/cxg-workflow implement user authentication
/cxg-plan refactor payment service
/cxg-review
```

### Verify Installation

```bash
npx cxg-workflow doctor
```

### Uninstall

```bash
npx cxg-workflow uninstall
```

## Commands

### Core Workflow

| Command | Description |
|---------|-------------|
| `/cxg-workflow` | Full 5-phase structured workflow |
| `/cxg-plan` | Generate an implementation plan |
| `/cxg-execute` | Execute an approved plan file |

### Development

| Command | Description |
|---------|-------------|
| `/cxg-feat` | Smart feature development |
| `/cxg-analyze` | Technical analysis without code changes |
| `/cxg-debug` | Diagnose and fix problems |
| `/cxg-optimize` | Performance and resource optimization |

### Quality

| Command | Description |
|---------|-------------|
| `/cxg-test` | Test design and generation |
| `/cxg-review` | Quality and security review |
| `/cxg-enhance` | Turn vague requests into structured tasks |

### Delivery And Bootstrap

| Command | Description |
|---------|-------------|
| `/cxg-commit` | Generate Conventional Commit messages |
| `/cxg-init` | Generate project `AGENTS.md` context docs |

## Workflow Guides

### Planning And Execution Separation

```bash
# 1. Generate the plan
/cxg-plan implement user authentication

# 2. Review and adjust the generated plan
# plan file is saved under .codex/plan/

# 3. Execute the approved plan
/cxg-execute .codex/plan/user-auth.md
```

### Full Workflow For Larger Tasks

```bash
/cxg-workflow implement invoice export with audit logging
```

Use the full workflow when the task spans multiple modules, needs tradeoff analysis, or should go through an explicit optimization and review phase.

### Initialize Project Context

```bash
/cxg-init build a modular AGENTS.md for this repository
```

This command generates root-level and module-level `AGENTS.md` files using a "concise at root, detailed by module" strategy.

## Configuration

### Installed Layout

```text
~/.codex/
├── prompts/
│   ├── cxg-workflow.md
│   ├── cxg-plan.md
│   └── ...
├── skills/
│   └── cxg/
│       ├── workflow/SKILL.md
│       ├── plan/SKILL.md
│       └── ...
├── bin/
│   └── codeagent-wrapper
├── config.toml              # Codex MCP config when ace-tool is enabled
└── .cxg/
    ├── config.toml
    └── roles/
        └── codex/
            ├── analyzer.md
            ├── architect.md
            └── reviewer.md
```

### CXG Config

CXG stores its own state in `~/.codex/.cxg/config.toml`, including:

- installed command list
- wrapper path
- role prompt paths
- selected MCP provider
- whether `--lite` mode was used

### MCP Options

**`ace-tool`**

- Install with `npx cxg-workflow init --mcp ace-tool`
- CXG writes the MCP server entry into `~/.codex/config.toml`
- Prompt templates use `mcp__ace-tool__search_context`

**`contextweaver`**

- Select with `npx cxg-workflow init --mcp contextweaver`
- CXG records the provider and prints manual setup guidance
- You still need to install `contextweaver` yourself and configure `~/.contextweaver/.env`

**`skip`**

- Default behavior
- Prompt templates fall back to filesystem search via `Glob + Grep`

## Supported Platforms

`codeagent-wrapper` binaries are resolved per platform and architecture:

- macOS `arm64` / `amd64`
- Linux `arm64` / `amd64`
- Windows `arm64` / `amd64`

## GitHub CI/CD

CXG can use GitHub Actions for both CI and npm release automation:

- `CI`: runs on every push and pull request to `main`, executing `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` on Node.js 20 and 22.
- `Publish to npm`: runs when a Git tag matching `v*.*.*` is pushed. The workflow verifies that the tag matches `package.json`, reruns validation, and publishes to npm with provenance enabled.

Required repository secret:

- `NPM_TOKEN`: npm automation token with publish access to the `cxg-workflow` package

Recommended release flow:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git commit -am "chore: release v0.1.1"
git tag v0.1.1
git push origin main --tags
```

`codeagent-wrapper` is still downloaded from the shared GitHub Release maintained by `fengshao1227/ccg-workflow` under the `preset` tag. CXG's GitHub workflow added here covers the npm package itself, not binary compilation.

## FAQ

### The slash commands do not appear in Codex CLI

Run `npx cxg-workflow init`, then restart Codex CLI. CXG installs prompt files into `~/.codex/prompts/`, which Codex loads as slash commands.

### Installation failed while downloading `codeagent-wrapper`

`init` fetches the binary from GitHub Releases. Check network access first, then rerun:

```bash
npx cxg-workflow init --force
```

### I selected `contextweaver`, but retrieval still does not work

That option does not fully provision ContextWeaver for you. Install the `contextweaver` executable and configure `~/.contextweaver/.env`, or switch to `ace-tool`.

## License

MIT
