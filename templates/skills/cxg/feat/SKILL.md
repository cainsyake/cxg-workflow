---
name: cxg-feat
description: "CXG 智能功能开发。使用场景：快速开发新功能，自动识别复杂度并选择合适流程。适合中小功能的快速实现。触发词：feat、功能开发、新增功能、实现功能。"
metadata:
  short-description: "智能功能开发"
---

# CXG Feat - 智能功能开发

快速开发新功能，自动识别需求类型并选择合适的开发流程。

## 子进程调用规范

```
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{ROLE_ARCHITECT}}
<TASK>
需求：<功能需求>
上下文：<项目上下文>
</TASK>
OUTPUT: 架构设计 + Unified Diff Patch
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "架构分析"
})
```

**等待后台任务**：`TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`

---

## 执行工作流

### 阶段 1：需求理解

`[模式：分析]`

1. 分析需求，识别功能类型（新增 / 扩展 / 重构）
2. 调用 `{{MCP_SEARCH_TOOL}}` 检索相关代码
3. 评估复杂度：简单（1-2 文件）→ 直接实施 | 中等（3-5 文件）→ 简要规划 | 复杂（>5 文件）→ 建议 `$cxg-workflow`

### 阶段 2：快速规划

中等/复杂任务调用子进程（architect 角色），生成简要实施方案。请求用户确认。

### 阶段 3：实施

按规划实施代码变更，遵循项目现有代码规范。

### 阶段 4：验证

运行相关测试，检查类型错误，简要总结变更。

---

## 关键规则

1. **快速交付** — 避免过度设计
2. **遵循规范** — 与现有代码风格一致
3. 复杂任务建议使用完整工作流
