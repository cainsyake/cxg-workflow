---
name: cxg-optimize
description: "CXG 性能优化。使用场景：分析性能瓶颈并实施优化，适合响应慢、内存泄漏、构建慢等性能问题。触发词：optimize、优化、性能、加速。"
metadata:
  short-description: "性能分析与优化"
---

# CXG Optimize - 性能优化

分析性能瓶颈并实施优化。

## 子进程调用规范

```
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{ROLE_REVIEWER}}
<TASK>
需求：性能分析与优化建议
目标：<优化目标>
上下文：<相关代码和性能数据>
</TASK>
OUTPUT: 性能瓶颈分析 + 优化方案
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "性能分析"
})
```

**等待后台任务**：`TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`

---

## 执行工作流

### 阶段 1：性能分析

调用 `{{MCP_SEARCH_TOOL}}` 检索代码，识别性能热点。调用子进程（reviewer 角色）深度分析。

### 阶段 2：优化方案

按优先级列出优化建议（P0/P1/P2），请求用户选择。

### 阶段 3：实施优化

按选定方案实施，保持代码可读性。

### 阶段 4：验证

运行测试，对比优化前后指标。

---

## 关键规则

1. **量化优先** — 优化要有可度量的收益
2. **不牺牲可读性** — 避免过度优化
3. 优化后必须通过所有测试
