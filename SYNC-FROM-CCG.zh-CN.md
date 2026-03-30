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
| 子 Agent 模板资产 | `templates/commands/agents/**` | `templates/commands/agents/**` | 资产迁入并在 `init` 安装到 `~/.codex/.cxg/agents/codex` | 已同步 |
| 结构化流程模板 | `templates/commands/workflow.md` 的 workflow 编排思路 | `templates/prompts/cxg-workflow.md` | 保留流程骨架并收敛为单模型 | 已同步 |
| 子进程角色分工 | 原项目子进程编排思路 | `templates/roles/codex/{analyzer,analyzer-frontend,architect,architect-frontend,debugger,debugger-frontend,frontend,optimizer,optimizer-frontend,reviewer,reviewer-frontend,tester,tester-frontend}.md` | 复用角色化分工并扩展前后端专用角色 | 已同步 |
| Wrapper 下载发布源 | `fengshao1227/ccg-workflow` Release `preset` | `src/utils/constants.ts` | 共享二进制发布源 | 仍依赖上游 |
| Skills 安装链路 | 安装时复制模板并渲染 | `src/utils/installer.ts` | `init` 安装到 `~/.codex/skills/cxg` | 已同步 |

## 差异矩阵（ccg-workflow vs cxg-workflow）

| 维度 | ccg-workflow | cxg-workflow | 影响 |
|---|---|---|---|
| 架构定位 | Claude + Codex + Gemini 多模型协作 | Codex 单模型编排 + Codex 子进程 | 路由复杂度降低，使用路径更直接 |
| 工作流阶段 | 以多阶段多模型协作为主（含 6 阶段历史路径） | 固定 6 阶段：研究->构思->计划->执行->优化->评审 | 流程更稳定，阶段边界更清晰 |
| 命令体系 | `/ccg:*` 命令族 | `/cxg-*` 命令族 | 命令命名与调用上下文不同 |
| 安装目录 | 主要落在 `~/.claude/` 体系 | 主要落在 `~/.codex/` 体系 | 与 Codex CLI 目录结构对齐 |
| MCP 配置写入目标 | 文档说明可同步到 `~/.codex/config.toml` 与 `~/.gemini/settings.json` | 文档说明写入 `~/.codex/config.toml` | CXG 只维护 Codex 侧配置 |
| 二进制发布关系 | 项目自身维护 wrapper 发布 | 仍复用上游 `ccg-workflow` 的 `preset` 发布 | CXG 与 wrapper 发布节奏存在耦合 |
| 命令规模 | README 声明约 27 个 `/ccg:*` 命令 | README/常量定义 12 个 `/cxg-*` 命令 | CXG 学习和维护面更小 |

## 事实锚点（可回溯）

- 衍生关系说明：`README.zh-CN.md`
- Skills 迁入说明：`README.zh-CN.md`（“仓库资产”小节）
- 6 阶段流程定义：`templates/prompts/cxg-workflow.md`
- 上游发布源常量：`src/utils/constants.ts`
- Skills 安装逻辑：`src/utils/installer.ts`
- 迁移遗留标记校验：`src/utils/__tests__/installer.test.ts`

## 维护规则

当以下内容发生变更时，必须同步更新本文件：

1. `templates/skills/**` 的迁入或结构变化
2. `templates/commands/agents/**` 的迁入或结构变化
3. `templates/prompts/cxg-workflow.md` 的阶段定义变化
4. `templates/roles/codex/**` 的角色职责变化
5. `src/utils/constants.ts` 中 wrapper 发布源相关字段变化
6. 命令体系或安装目录发生设计级变化
7. `README.zh-CN.md` 中“衍生关系/仓库资产”相关说明变化
8. `src/utils/__tests__/installer.test.ts` 中迁移守卫（legacy markers）变化

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

- 日期：2026-03-25
- 触发原因：同步修复后进行一致性回填（命令命名、阶段定义、角色扩展、文案规范）
- 影响条目：更新子进程角色矩阵为前后端双轨；工作流阶段更新为固定 6 阶段；事实锚点从“5 阶段”修正为“6 阶段”；README/README.zh-CN 与 prompts 命令命名统一为 `/cxg-*`
- 结论：本次修复覆盖同步文档触发条件 2/3/5/6/7，文档与模板实现已对齐

- 日期：2026-03-25
- 触发原因：将 `ccg-workflow/templates/prompts/gemini` 中前端角色文档（`debugger.md`、`frontend.md`、`optimizer.md`、`tester.md`）迁移至 CXG 的 Codex 角色体系
- 影响条目：新增 `templates/roles/codex/{debugger-frontend,frontend,optimizer-frontend,tester-frontend}.md`；更新 `cxg-debug/cxg-feat/cxg-optimize/cxg-test/cxg-workflow` 的前端角色引用；扩展模板变量替换与安装完整性测试
- 结论：已在“仍使用 Codex 单模型”约束下完成前端角色迁移，未引入 Gemini 路由

- 日期：2026-03-25
- 触发原因：将 `ccg-workflow/templates/prompts/codex` 中后端角色文档（`debugger.md`、`optimizer.md`、`tester.md`）迁移到 CXG 角色目录并接入命令模板
- 影响条目：新增 `templates/roles/codex/{debugger,optimizer,tester}.md`；更新 `cxg-debug/cxg-optimize/cxg-test/cxg-workflow` 后端角色引用；扩展 `template.ts` 路径替换与安装测试守卫
- 结论：后端调试/优化/测试角色已与前端专项角色并行纳入 Codex 单模型角色体系
