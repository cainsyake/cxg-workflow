---
name: cxg-commit
description: 'Skill workflow ''cxg-commit''. Use when Codex should follow
  this skill workflow: CXG Commit - 智能 Git 提交. Key intent: 分析当前改动，生成 Conventional
  Commits 风格的提交信息。.'
---

# CXG Commit - 智能 Git 提交

分析当前改动，生成 Conventional Commits 风格的提交信息。

## 使用方法

```bash
$cxg-commit [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--no-verify` | 跳过 Git hooks |
| `--all` | 暂存所有改动 |
| `--amend` | 修补上次提交 |
| `--signoff` | 附加 `Signed-off-by` |
| `--scope <scope>` | 指定作用域 |
| `--type <type>` | 指定提交类型 |

---

## 执行工作流

### 阶段 1：仓库校验

`[模式：检查]`

1. 验证 Git 仓库状态
2. 检测 rebase/merge 冲突
3. 读取当前分支/HEAD 状态

### 阶段 2：改动检测

`[模式：分析]`

1. 获取已暂存与未暂存改动
2. 若暂存区为空：
   - `--all` → 执行 `git add -A`
   - 否则用询问用户是否暂存全部或先拆分提交
3. 若同时存在已暂存与未暂存改动，明确告知本次提交范围仅基于暂存区（除非使用 `--all`）

### 阶段 3：拆分建议

`[模式：建议]`

按以下维度聚类改动并评估是否拆分：
- 关注点（源码 vs 文档/测试）
- 文件路径（是否跨多个顶级目录/模块）
- 变更类型（功能、修复、重构、样式等）

若检测到多组独立变更（例如：`>300` 行或跨多个顶级目录），建议拆分为多次提交。

### 阶段 4：生成提交信息

`[模式：生成]`

**格式**：`<type>(<scope>): <subject>`

- 首行 ≤ 72 字符
- 祈使语气
- 消息体：动机、实现要点、影响范围
- 若 scope 不适用，使用 `<type>: <subject>`
- `--type` / `--scope` 优先级高于自动推断

**语言**：根据最近 50 次提交判断中文/英文

将最终提交信息写入 `.git/COMMIT_EDITMSG`。

### 阶段 5：执行提交

`[模式：执行]`

```bash
git commit [--amend] [--no-verify] [-s] -F .git/COMMIT_EDITMSG
```

---

## Type 映射

| Type | 说明 |
|------|------|
| `feat` | 新增功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档更新 |
| `style` | 代码格式 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具 |
| `ci` | CI/CD 变更 |
| `revert` | 回滚提交 |

---

## 示例

```bash
# 基本提交
$cxg-commit

# 暂存全部并提交
$cxg-commit --all

# 指定类型与作用域
$cxg-commit --type feat --scope api

# 修补上次提交并附加签名
$cxg-commit --amend --signoff
```

---

## 关键规则

1. **仅使用 Git** — 不调用包管理器或外部模型工具链
2. **尊重钩子** — 默认执行 Git hooks，仅在 `--no-verify` 时跳过
3. **不改源码** — 只读写提交相关文件（主要是 `.git/COMMIT_EDITMSG`）
4. **原子提交** — 一次提交只做一件事，必要时先拆分
