---
name: release-version
description: 用于 Node.js 仓库的发版自动化：递增 package.json 版本号（patch/minor/major 或显式版本）、创建 release commit、打 git tag，并 push 分支与 tag 触发 GitHub Actions 发布。用户提到“发版”“release”“打 tag”“推送触发构建”或需要一次性完成版本递增+提交+标签+推送时使用。
---

# Release Version Skill

执行此技能时，只处理当前仓库发版流程，不改动 `templates/` 目录内容。

## Quick Start

运行发布脚本：

```bash
./.codex/skills/release-version/scripts/release.sh <patch|minor|major|x.y.z>
```

常用示例：

```bash
# patch 发版（例如 0.4.2 -> 0.4.3）
./.codex/skills/release-version/scripts/release.sh patch

# minor 发版（例如 0.4.2 -> 0.5.0）
./.codex/skills/release-version/scripts/release.sh minor

# 指定版本（例如 1.0.0）
./.codex/skills/release-version/scripts/release.sh 1.0.0

# 仅演练命令，不修改文件、不提交、不推送
./.codex/skills/release-version/scripts/release.sh patch --dry-run
```

## Workflow

按以下顺序执行：

1. 校验运行环境：`git`、`node`、`package.json`、当前目录为 Git 仓库。
2. 校验仓库状态：要求工作区干净，避免把无关改动带入 release commit。
3. 解析并计算下一版本号：支持 `patch`、`minor`、`major`、显式 `x.y.z`。
4. 默认执行发布前检查：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
5. 更新 `package.json` 的 `version` 字段并写回。
6. 生成提交：`chore: release vX.Y.Z`。
7. 打标签：`vX.Y.Z`。
8. 推送当前分支到远端（默认 `origin`）。
9. 推送标签到远端，触发 `.github/workflows/publish.yml`。

## Script Flags

- `--dry-run`: 输出将执行的命令，不修改仓库。
- `--skip-checks`: 跳过 `lint/typecheck/test/build`。
- `--remote <name>`: 指定远端名称，默认 `origin`。
- `-h, --help`: 查看帮助。

## Failure Handling

当脚本在 commit 或 tag 之后失败时，按状态修复：

1. 已打本地 tag 但未推送：`git tag -d vX.Y.Z` 后重试。
2. 已推送分支但未推送 tag：直接重跑脚本会因非干净工作区失败，改为手动推送标签 `git push origin vX.Y.Z`。
3. 错误版本已推到远端：先删除远端 tag `git push origin :refs/tags/vX.Y.Z`，再修复版本并重新发布。

## Resource

使用脚本：

`scripts/release.sh`
