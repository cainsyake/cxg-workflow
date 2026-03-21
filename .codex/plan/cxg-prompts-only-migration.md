# CXG Prompts 核心化 + Skills 迁移实施计划（方案 A）

## 目标
- 清除 `templates/skills/cxg` 旧机制。
- 迁入 `ccg-workflow/templates/skills` 到 `cxg-workflow` 作为资产目录。
- 运行时以 prompts 为核心，同时保留 skills 安装：安装 prompts + skills + roles + binary。
- 保留历史 `~/.codex/skills/cxg` 清理与升级回滚兼容。

## 执行步骤
1. 删除 `templates/skills/cxg/**`，迁入 `templates/skills/**`。
2. 改 `src/utils/installer.ts`：改为从 `templates/skills` 安装 skills，并递归渲染 markdown 模板。
3. 改 `init/doctor/menu/uninstall/update`：恢复 skills 安装、检查与卸载/回滚链路。
4. 改测试：移除对旧 `templates/skills/cxg/*` 结构的校验，改为校验迁移后的 skills 资产。
5. 改文档：README/README.zh-CN/AGENTS 对齐“init 安装 prompts + skills + roles + wrapper”。
6. 验证：`pnpm test && pnpm typecheck && pnpm lint`。
