# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the TypeScript source for CLI entrypoints, commands, shared utilities, and exported types. Use `src/commands/` for user-facing actions, `src/utils/` for reusable logic, and `src/types/` for shared interfaces. Runtime templates live in `templates/prompts/`, `templates/skills/`, and `templates/roles/codex/`. Treat `dist/` as generated output.

Tests are colocated under `src/**/__tests__/*.test.ts`. An empty top-level `test/` directory exists, but current coverage is maintained beside the modules it validates.

## Build, Test, and Development Commands
Use `pnpm` for local work.

- `pnpm dev` runs the CLI directly from `src/cli.ts` with `tsx`.
- `pnpm build` bundles ESM output into `dist/` with `unbuild`.
- `pnpm start` runs the packaged binary from `bin/cxg.mjs`.
- `pnpm typecheck` runs strict TypeScript checks without emitting files.
- `pnpm test` runs the Vitest suite once.
- `pnpm lint` checks style with ESLint.
- `pnpm lint:fix` applies safe ESLint fixes.

For behavior checks, prefer commands such as `pnpm dev doctor` or `npx cxg-workflow init --skip-mcp`.

## Coding Style & Naming Conventions
Follow the existing ESM TypeScript style: 2-space indentation, single quotes, no semicolons, and strict typing. Use short modules and named exports for shared utilities. File names are lowercase and descriptive: `src/utils/template.ts`, `src/commands/init.ts`. Tests use `*.test.ts`. Keep command IDs and matching template files in kebab-case with the `cxg-` prefix, for example `templates/prompts/cxg-review.md`.

## Testing Guidelines
Vitest is the test framework. Add unit tests next to the implementation you change and name them after the target module, for example `src/utils/__tests__/installer.test.ts`. Cover command registry updates, template completeness, and path or config transformations. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint` before opening a PR.

## Commit & Pull Request Guidelines
The current history uses Conventional Commit formatting, for example `feat: initialize cxg workflow project`. Continue with prefixes like `feat:`, `fix:`, `refactor:`, and `test:`. PRs should include a short description, linked issue when applicable, and the exact verification commands you ran. Include terminal output or screenshots only when CLI UX or install flow changes.

## Template & Configuration Safety
This package installs files into `~/.codex/` at runtime. Do not hardcode user-specific home paths in templates or source; use the existing config and template helpers instead. When adding a new slash command, update the prompt template and command registry constants together so installer and completeness tests stay aligned.
