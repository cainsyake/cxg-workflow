# CXG - Codex 单模型结构化工作流

<div align="center">

[English](./README.md) | 简体中文

</div>

CXG 是一个面向 Codex CLI 的单模型工作流包。它会安装一组结构化 Skills、角色提示词和 `codeagent-wrapper` 二进制，使 Codex 能以统一方式完成研究、规划、执行、优化和评审。

> 说明：CXG 基于 [`ccg-workflow`](https://github.com/fengshao1227/ccg-workflow) 项目衍生而来，可视为面向 Codex 的单模型简化版。它保留了原项目的结构化工作流与 wrapper 编排思路，但将范围收敛为更精简的 Codex-only 使用体验。

## 为什么选择 CXG？

- **基于 `ccg-workflow` 衍生**：延续原项目的工作流设计思路，同时简化为仅面向 Codex 的轻量版本。
- **单模型协作**：不做多模型路由，只使用 Codex 主会话加 Codex 子进程角色分工。
- **结构化交付**：主工作流固定为 `研究 -> 计划 -> 执行 -> 优化 -> 评审`。
- **内置专家角色**：提供 `analyzer`、`architect`、`reviewer` 三类角色提示词。
- **可选代码检索**：支持 `ace-tool`，可预留 `contextweaver`，不配置 MCP 时自动退回 `Glob + Grep`。
- **Skills 优先命令体系**：安装后会把 12 个工作流技能写入 `~/.codex/skills/cxg/`。

## 架构

```text
Codex CLI
   |
   +-- skills/cxg/*
   |
   +-- codeagent-wrapper
          |
          +-- Codex 子进程（analyzer / architect / reviewer）
```

主 Codex 会话负责整体编排，子进程负责聚焦分析、规划和审查，再把结果回传给主会话继续推进。

## 快速开始

### 前置条件

| 依赖 | 必需 | 说明 |
|------|------|------|
| Node.js | 是 | 建议 Node.js 18+，便于兼容 ESM 和内置 `fetch` |
| Codex CLI | 是 | CXG 会把命令安装到 `~/.codex/` 供 Codex CLI 使用 |
| GitHub Releases 访问能力 | 是 | `init` 时会下载 `codeagent-wrapper` |
| ace-tool | 否 | 可选的 MCP 代码检索提供者 |
| ContextWeaver | 否 | 可选的 MCP 检索提供者，需要手动配置 |

### 安装

```bash
npx cxg-workflow init
```

常用变体：

```bash
# 强制覆盖已有 CXG 文件
npx cxg-workflow init --force

# 默认精简模式安装（禁用 WebUI）
npx cxg-workflow init

# 关闭精简模式（启用 WebUI 相关行为）
npx cxg-workflow init --no-lite

# 在菜单中交互切换 Lite 模式（选项 5）
npx cxg-workflow menu

# 显式指定 ace-tool（默认行为）
npx cxg-workflow init --mcp ace-tool

# 跳过 MCP，使用文件系统检索兜底
npx cxg-workflow init --skip-mcp
```

安装完成后，在 Codex CLI 中通过技能名触发：

```bash
$cxg-workflow 实现用户认证
$cxg-plan 重构支付服务
$cxg-review
```

### 验证安装

```bash
npx cxg-workflow doctor
```

### 查看版本与更新

```bash
# 查看 CLI / 本地工作流 / binary 状态
npx cxg-workflow version --check

# 原子更新（失败自动回滚）
npx cxg-workflow update

# 非交互更新
npx cxg-workflow update --yes
```

### 卸载

```bash
npx cxg-workflow uninstall
```

## 命令

### 核心工作流

| 命令 | 说明 |
|------|------|
| `$cxg-workflow` | 完整 5 阶段结构化工作流 |
| `$cxg-plan` | 生成实施计划 |
| `$cxg-execute` | 按已批准的计划文件执行 |

### 开发类

| 命令 | 说明 |
|------|------|
| `$cxg-feat` | 智能功能开发 |
| `$cxg-analyze` | 只分析，不改代码 |
| `$cxg-debug` | 问题诊断与修复 |
| `$cxg-optimize` | 性能与资源优化 |

### 质量类

| 命令 | 说明 |
|------|------|
| `$cxg-test` | 测试设计与生成 |
| `$cxg-review` | 质量与安全审查 |
| `$cxg-enhance` | 将模糊需求整理成结构化任务 |

### 交付与初始化

| 命令 | 说明 |
|------|------|
| `$cxg-commit` | 生成 Conventional Commit 提交信息 |
| `$cxg-init` | 生成项目 `AGENTS.md` 上下文文档 |

## 工作流指南

### 计划与执行分离

```bash
# 1. 生成计划
$cxg-plan 实现用户认证

# 2. 审查并调整生成的计划
# 计划文件保存在 .codex/plan/ 下

# 3. 执行已批准的计划
$cxg-execute .codex/plan/user-auth.md
```

### 复杂任务使用完整工作流

```bash
$cxg-workflow 实现发票导出与审计日志
```

当任务跨多个模块、需要方案权衡、或者希望显式经过优化与评审阶段时，优先使用完整工作流。

### 初始化项目上下文

```bash
$cxg-init 为当前仓库生成模块化 AGENTS.md
```

该命令会按“根级简明、模块级详尽”的策略生成根目录和模块目录下的 `AGENTS.md`。

## 配置

### 安装后的目录结构

```text
~/.codex/
├── skills/
│   └── cxg/
│       ├── workflow/SKILL.md
│       ├── plan/SKILL.md
│       └── ...
├── bin/
│   └── codeagent-wrapper
├── config.toml              # 启用 ace-tool 时写入 Codex MCP 配置
└── .cxg/
    ├── config.toml
    └── roles/
        └── codex/
            ├── analyzer.md
            ├── architect.md
            └── reviewer.md
```

### CXG 配置文件

CXG 自身状态保存在 `~/.codex/.cxg/config.toml`，包含：

- 已安装命令列表
- wrapper 路径
- 角色提示词路径
- 当前 MCP provider
- 是否启用 lite 模式（默认 `true`）

### MCP 配置

**`ace-tool`**

- 默认使用 `npx cxg-workflow init`
- 也可显式指定 `npx cxg-workflow init --mcp ace-tool`
- CXG 会把 MCP 服务写入 `~/.codex/config.toml`
- Skill 模板内部调用 `mcp__ace-tool__search_context`

**`contextweaver`**

- 使用 `npx cxg-workflow init --mcp contextweaver`
- CXG 只会记录 provider 并提示你继续手动配置
- 你仍需自行安装 `contextweaver` 可执行文件并配置 `~/.contextweaver/.env`

**`skip`**

- 使用 `npx cxg-workflow init --skip-mcp`
- Skill 模板自动退回 `Glob + Grep` 文件系统检索

## 支持平台

`codeagent-wrapper` 会按平台和架构自动选择二进制：

- macOS `arm64` / `amd64`
- Linux `arm64` / `amd64`
- Windows `arm64` / `amd64`

## GitHub CI/CD

CXG 可以通过 GitHub Actions 完成 CI 和 npm 自动发布：

- `CI`：在每次向 `main` 分支 push 或发起 PR 时运行，执行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`，并覆盖 Node.js 20、22。
- `Publish to npm`：在推送匹配 `v*.*.*` 的 Git tag 时触发。工作流会先校验 tag 与 `package.json` 版本一致，再重新执行校验，并以 `public` 访问级别发布到 npm，同时开启 provenance。

需要配置的仓库 Secret：

- `NPM_TOKEN`：具备 `cxg-workflow` 发布权限的 npm automation token

推荐发版流程：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git commit -am "chore: release v0.1.1"
git tag v0.1.1
git push origin main --tags
```

当前 `codeagent-wrapper` 仍然从 `fengshao1227/ccg-workflow` 仓库的 GitHub Release `preset` tag 下载。这里新增的 GitHub 工作流只负责 `cxg-workflow` npm 包本身，不负责编译二进制。

## 常见问题

### Codex CLI 里看不到技能

先执行 `npx cxg-workflow init`，然后重启 Codex CLI。CXG 会写入 `~/.codex/skills/cxg/` 下的 Skill 文件，并自动清理历史 `~/.codex/prompts/cxg-*.md` 文件。

### 安装时 `codeagent-wrapper` 下载失败

`init` 会从 GitHub Releases 拉取二进制。先检查网络，再重试：

```bash
npx cxg-workflow init --force
```

### 选择了 `contextweaver`，但代码检索仍然不可用

这个选项不会自动把 ContextWeaver 完整装好。你需要自己安装 `contextweaver` 命令并配置 `~/.contextweaver/.env`；如果不想手动处理，直接改用 `ace-tool`。

## License

MIT
