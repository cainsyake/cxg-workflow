---
name: cxg-debug
description: "CXG 问题诊断与修复。使用场景：定位 bug 根因并提供修复方案，适合错误排查、异常定位、问题修复。触发词：debug、调试、修复 bug、排查问题、报错。"
metadata:
  short-description: "问题诊断与修复"
---

# CXG Debug - 问题诊断与修复

定位问题根因并提供修复方案。

## 子进程调用规范

```
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{ROLE_ANALYZER}}
<TASK>
需求：诊断以下问题
问题描述：<问题描述>
上下文：<相关代码和错误信息>
</TASK>
OUTPUT: 根因分析 + 修复方案
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "问题诊断"
})
```

**等待后台任务**：`TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`

---

## 执行工作流

### 阶段 1：信息收集

收集错误信息、相关代码、环境信息。调用 `{{MCP_SEARCH_TOOL}}` 检索上下文。

### 阶段 2：根因分析

调用子进程（analyzer 角色）分析根因。补充复现路径和影响范围。

### 阶段 3：修复方案

提出修复方案，请求用户选择。

### 阶段 4：实施修复

执行选定方案，运行测试验证。

### 阶段 5：总结

输出调试报告：问题、根因、修复、验证、预防建议。

---

## 关键规则

1. **先诊断后修复** — 确认根因再修复
2. **最小修复** — 不引入不必要的变更
3. 修复后必须验证
