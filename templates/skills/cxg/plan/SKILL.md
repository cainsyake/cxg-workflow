---
name: cxg-plan
description: "CXG 技术规划。使用场景：需要生成详细的实施计划和架构设计，适合在开始编码前进行技术方案规划。触发词：plan、规划、计划、架构设计。"
metadata:
  short-description: "生成实施计划和架构设计"
---

# CXG Plan - 技术规划

生成详细的实施计划，包含架构设计和步骤分解。

## 子进程调用规范

```
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求>
上下文：<检索到的代码上下文>
</TASK>
OUTPUT: 期望输出格式
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**角色提示词**：分析用 `{{ROLE_ANALYZER}}`，规划用 `{{ROLE_ARCHITECT}}`

**等待后台任务**：`TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`

---

## 执行工作流

### 阶段 1：上下文收集

`[模式：研究]`

1. Prompt 增强：补全为结构化需求
2. 调用 `{{MCP_SEARCH_TOOL}}` 检索相关代码
3. 读取 AGENTS.md 了解项目上下文

### 阶段 2：技术分析

`[模式：分析]`

调用子进程（analyzer 角色）：分析技术可行性、识别风险、提出 2-3 个方案。保存 SESSION_ID，等待用户选择方案。

### 阶段 3：详细规划

`[模式：规划]`

调用子进程（architect 角色，resume SESSION）：基于用户选定方案，生成文件变更清单、架构设计、步骤分解、风险缓解。

### 阶段 4：输出计划

`[模式：输出]`

将计划保存到 `.codex/plan/任务名.md`。

---

## 关键规则

1. 子进程对文件系统**零写入权限**
2. 计划必须用户确认后才能执行
3. 提供可执行的具体步骤
