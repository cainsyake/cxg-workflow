# 从 ccg-workflow 同步与差异记录

## 文档说明

本文件用于记录 `ccg-workflow` 到 `cxg-workflow` 的同步内容与关键差异。  
维护策略：仅维护中文版本。

基线日期：2026-03-21
ccg 基线版本：v1.7.88（commit: `b4e5ca6`）
cxg 基线版本：v0.1.7（commit: `49c99da`）

## 同步清单（已同步/复用）

| 模块 | 来源（ccg-workflow） | CXG 落点 | 同步方式 | 当前状态 |
|---|---|---|---|---|
| Skills 资产 | `templates/skills/**` | `templates/skills/**` | 资产迁入并在 `init` 安装 | 已同步 |
| 结构化流程模板 | `templates/commands/workflow.md` 的 workflow 编排思路 | `templates/prompts/cxg-workflow.md` | 保留流程骨架并收敛为单模型 | 已同步 |
| 子进程角色分工 | 原项目子进程编排思路 | `templates/roles/codex/{analyzer,architect,reviewer}.md` | 复用角色化分工 | 已同步 |
| Wrapper 下载发布源 | `fengshao1227/ccg-workflow` Release `preset` | `src/utils/constants.ts` | 共享二进制发布源 | 仍依赖上游 |
| Skills 安装链路 | 安装时复制模板并渲染 | `src/utils/installer.ts` | `init` 安装到 `~/.codex/skills/cxg` | 已同步 |

## 差异矩阵（ccg-workflow vs cxg-workflow）

| 维度 | ccg-workflow | cxg-workflow | 影响 |
|---|---|---|---|
| 架构定位 | Claude + Codex + Gemini 多模型协作 | Codex 单模型编排 + Codex 子进程 | 路由复杂度降低，使用路径更直接 |
| 工作流阶段 | 以多阶段多模型协作为主（含 6 阶段历史路径） | 固定 5 阶段：研究->计划->执行->优化->评审 | 流程更稳定，阶段边界更清晰 |
| 命令体系 | `/ccg:*` 命令族 | `/cxg-*` 命令族 | 命令命名与调用上下文不同 |
| 安装目录 | 主要落在 `~/.claude/` 体系 | 主要落在 `~/.codex/` 体系 | 与 Codex CLI 目录结构对齐 |
| MCP 配置写入目标 | 文档说明可同步到 `~/.codex/config.toml` 与 `~/.gemini/settings.json` | 文档说明写入 `~/.codex/config.toml` | CXG 只维护 Codex 侧配置 |
| 二进制发布关系 | 项目自身维护 wrapper 发布 | 仍复用上游 `ccg-workflow` 的 `preset` 发布 | CXG 与 wrapper 发布节奏存在耦合 |
| 命令规模 | README 声明约 27 个 `/ccg:*` 命令 | README/常量定义 12 个 `/cxg-*` 命令 | CXG 学习和维护面更小 |

## 事实锚点（可回溯）

- 衍生关系说明：`README.zh-CN.md`
- Skills 迁入说明：`README.zh-CN.md`（“仓库资产”小节）
- 5 阶段流程定义：`templates/prompts/cxg-workflow.md`
- 上游发布源常量：`src/utils/constants.ts`
- Skills 安装逻辑：`src/utils/installer.ts`
- 迁移遗留标记校验：`src/utils/__tests__/installer.test.ts`

## 维护规则

当以下内容发生变更时，必须同步更新本文件：

1. `templates/skills/**` 的迁入或结构变化
2. `templates/prompts/cxg-workflow.md` 的阶段定义变化
3. `templates/roles/codex/**` 的角色职责变化
4. `src/utils/constants.ts` 中 wrapper 发布源相关字段变化
5. 命令体系或安装目录发生设计级变化
6. `README.zh-CN.md` 中“衍生关系/仓库资产”相关说明变化
7. `src/utils/__tests__/installer.test.ts` 中迁移守卫（legacy markers）变化

建议更新格式：

- 日期：
- 触发原因：
- 影响条目（同步清单/差异矩阵）：
- 结论：

## 更新记录

- 日期：2026-03-21
- 触发原因：补齐 `cxg-workflow` 对 `ccg-workflow` 的同步清单与差异矩阵文档化
- 影响条目：新增本文件；`README.zh-CN.md` 新增入口；基线版本与 commit 字段；维护触发条件扩展
- 结论：文档层变更已落地，未涉及代码逻辑
