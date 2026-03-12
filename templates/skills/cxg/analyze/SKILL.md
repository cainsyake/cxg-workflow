---
name: cxg-analyze
description: "CXG 技术分析。使用场景：需要深度技术分析但不修改代码，适合技术选型、架构评估、性能分析、安全审计。触发词：analyze、分析、评估、审计。"
metadata:
  short-description: "深度技术分析（只读）"
---

# CXG Analyze - 技术分析

使用 Codex 子进程进行深度技术分析。**仅分析，不修改代码。**

## 子进程调用规范

```
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{ROLE_ANALYZER}}
<TASK>
需求：<增强后的需求>
上下文：<检索到的代码上下文>
</TASK>
OUTPUT: 技术可行性、架构影响、方案建议
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "技术分析"
})
```

**等待后台任务**：`TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`

---

## 执行工作流

### 阶段 1：上下文检索

`[模式：研究]`

1. Prompt 增强：补全为结构化需求
2. 调用 `{{MCP_SEARCH_TOOL}}` 检索相关代码

### 阶段 2：深度分析

`[模式：分析]`

调用子进程（analyzer 角色）：技术可行性、架构影响、方案对比、风险识别。

### 阶段 3：综合输出

`[模式：总结]`

输出：核心发现、方案对比表、推荐方案、后续行动。

---

## 关键规则

1. **仅分析不修改** — 不执行任何代码变更
2. 子进程对文件系统**零写入权限**
