---
name: cxg-commit
description: "CXG 智能 Git 提交。使用场景：分析当前改动生成 Conventional Commits 风格的提交信息，支持拆分建议。触发词：commit、提交、git commit。"
metadata:
  short-description: "Conventional Commit 生成"
---

# CXG Commit - 智能 Git 提交

分析当前改动，生成 Conventional Commits 风格的提交信息。

## 执行工作流

### 阶段 1：仓库校验

验证 Git 仓库状态，检测冲突。

### 阶段 2：改动检测

获取已暂存与未暂存改动。

### 阶段 3：拆分建议

若检测到多组独立变更（>300 行 / 跨多个顶级目录），建议拆分。

### 阶段 4：生成提交信息

格式：`[emoji] <type>(<scope>): <subject>`，首行 ≤ 72 字符。语言根据最近提交判断。

### 阶段 5：执行提交

```bash
git commit -F .git/COMMIT_EDITMSG
```

## Type 映射

| Emoji | Type | 说明 |
|-------|------|------|
| ✨ | feat | 新增功能 |
| 🐛 | fix | 缺陷修复 |
| 📝 | docs | 文档更新 |
| ♻️ | refactor | 重构 |
| ⚡️ | perf | 性能优化 |
| ✅ | test | 测试相关 |
| 🔧 | chore | 构建/工具 |

---

## 关键规则

1. **仅使用 Git** — 不调用包管理器
2. **原子提交** — 一次提交只做一件事
