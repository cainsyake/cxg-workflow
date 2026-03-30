# CXG Agent 模板迁移实施计划（方案 A）

## 目标
- 将 `ccg-workflow/templates/commands/agents` 的 4 个子 agent 提示词迁移到 `cxg-workflow`。
- 作为预置模板资产随包发布，并在 `init` 安装到 `~/.codex/.cxg/agents/codex/`。
- 与 `cxg-init`、`cxg-feat` 等工作流协同。
- 继续使用 `codeagent-wrapper --backend codex` 调用子进程。
- 子进程支持写入文件，但按命令/阶段分层约束。

## 范围
- 包含：模板资产、安装/卸载/诊断、变量注入、prompts 接入、测试、文档、发布清单。
- 不包含：替换 wrapper、改动非 CXG 相关命令体系。

## 执行步骤
1. 新增 `templates/commands/agents/` 并迁入 4 个模板。
2. 更新 `package.json` `files`，包含 `templates/commands/`。
3. 扩展类型与配置：`paths.agents`、`installedAgents`、`removedAgents`。
4. 扩展常量与模板变量：`AGENT_TEMPLATES` + `AGENT_*` 路径注入。
5. 扩展 installer：安装 agents、postflight 校验 agents、uninstall 统计 removedAgents。
6. 更新命令输出与诊断：`init` 展示 agents，`doctor` 检查 agents，`menu` 文案补齐。
7. 更新 prompts：`cxg-init`、`cxg-feat` 接入 AGENT_*；统一写权限分层文案。
8. 更新测试：installer/template/config + 模板完整性断言。
9. 更新文档：README/README.zh-CN/SYNC-FROM-CCG/AGENTS。
10. 验证：`pnpm test && pnpm typecheck && pnpm lint`。

## 写权限策略
- 只读：`cxg-analyze`、`cxg-review`。
- 计划文件可写：`cxg-plan`（仅 `.codex/plan/*`）。
- 条件可写：`cxg-init`、`cxg-feat`、`cxg-execute`、`cxg-workflow` 阶段 4（仅批准计划白名单范围）。

## 风险与回滚
- 风险：发布漏包、文案冲突、越权写入。
- 缓解：`pnpm pack` 校验、统一权限文本、白名单写入约束。
- 回滚：依赖现有 `.cxg` 原子更新/卸载链路。
