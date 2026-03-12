---
name: cxg-review
description: "CXG 代码审查。使用场景：对代码进行质量与安全审查，无参数时自动审查 git diff。适合代码提交前审查、PR 审查。触发词：review、审查、代码审查、code review。"
metadata:
  short-description: "代码质量与安全审查"
---

# CXG Review - 代码审查

对代码进行质量与安全审查。无参数时自动审查 git diff。

## 子进程调用规范

```
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{ROLE_REVIEWER}}
<TASK>
需求：审查以下代码变更
变更内容：<diff 或代码>
上下文：<项目上下文>
</TASK>
OUTPUT: 结构化审查报告（含评分）
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "代码审查"
})
```

**等待后台任务**：`TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`

---

## 执行工作流

### 阶段 1：收集变更

若无参数执行 `git diff`，若指定文件则读取对应代码。

### 阶段 2：子进程审查

调用子进程（reviewer 角色）：安全性、代码质量、性能、可维护性。

### 阶段 3：综合报告

输出评分报告（代码质量/安全性/性能/可维护性各 25 分）+ 必须修复 + 建议改进 + 结论。

---

## 关键规则

1. **客观公正** — 基于事实评估
2. **可操作** — 每个问题附带修复建议
3. **分级** — Critical > Warning > Info
