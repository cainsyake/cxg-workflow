---
name: cxg-execute
description: 'Skill workflow ''cxg-execute''. Use when Codex should follow
  this skill workflow: CXG Execute - 按计划执行与交付. Key intent: 读取已批准计划，获取 Codex 子进程原型，主
  Codex 重构实施并完成审计交付。.'
---

# CXG Execute - 按计划执行与交付

读取已批准计划，获取 Codex 子进程原型，主 Codex 重构实施并完成审计交付。

## 使用方法

```bash
$cxg-execute <计划文件路径或执行任务>
```

---

## 核心协议

- **语言协议**：与工具/子进程交互用英语，与用户交互用中文。
- **代码主权**：子进程对文件系统零写入权限，所有落盘修改由主 Codex 执行。
- **脏原型重构**：子进程给出的 Unified Diff 仅视为原型，必须重构为可维护生产代码。
- **止损机制**：当前阶段未验证通过前，不进入下一阶段。
- **前置条件**：仅在计划已获用户批准后执行；若批准状态不清晰，必须先澄清。

---

## 子进程调用规范

**工作目录**：
- `{{WORKDIR}}`：替换为目标工作目录绝对路径。
- 多工作区场景先检索定位，无法确定时向用户确认。

**原型调用语法**：

```text
# 复用会话（推荐）
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<任务描述>
上下文：<计划内容 + 关键文件 + 检索片段>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "实施原型"
})

# 新会话
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<任务描述>
上下文：<计划内容 + 关键文件 + 检索片段>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "实施原型"
})
```

**审计调用语法**：

```text
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
Scope: Audit final code changes.
Inputs:
- applied patch (git diff / final unified diff)
- touched files (relevant excerpts)
Constraints:
- Do NOT modify any files.
- Do NOT output tool commands that assume filesystem write access.
</TASK>
OUTPUT:
1) prioritized issues (severity, file, rationale)
2) concrete fixes; if needed, include Unified Diff Patch in fenced block.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "代码审计"
})
```

**角色提示词**：

| 阶段 | 后端/通用角色 | 前端/UI 角色 |
|------|----------------|--------------|
| 实施原型 | `{{ROLE_ARCHITECT}}` | `{{ROLE_FRONTEND}}` |
| 审计复核 | `{{ROLE_REVIEWER}}` | `{{ROLE_REVIEWER_FRONTEND}}` |

**会话复用**：优先复用计划中的 `CODEX_SESSION` 与 `CODEX_FRONTEND_SESSION`。

**后台等待**：并行调用后，使用运行时提供的后台结果查询机制持续轮询，直到全部结果返回。

**重要**：
- 必须指定 `timeout: 600000`，否则默认 30 秒易提前超时。
- 若 10 分钟后仍未完成，继续轮询，绝对不要 Kill 已启动任务。
- 若等待过长需要中断，先向用户说明并获得明确确认。
- ⛔ **Codex 结果必须等待**：Codex 执行通常需 5-15 分钟。单次查询超时后必须继续轮询，禁止跳过未返回结果进入下一阶段。

---

## 执行工作流

**执行任务**：$ARGUMENTS

### 阶段 0：读取计划

`[模式：准备]`

1. 识别输入类型：计划文件路径 / 直接任务描述
2. 若是计划路径：读取并提取任务类型、步骤、关键文件、会话 ID
3. 若是直接描述或计划信息不足：先补全关键信息再继续
4. 判断任务类型：前端 / 后端 / 全栈

### 阶段 1：上下文快速检索

`[模式：检索]`

优先调用 `{{MCP_SEARCH_TOOL}}`，围绕计划关键文件构建语义查询，获取实施必需上下文。

### 阶段 2：获取子进程原型

`[模式：原型]`

按任务类型路由：
- **前端任务**：调用 `{{ROLE_FRONTEND}}`
- **后端任务**：调用 `{{ROLE_ARCHITECT}}`
- **全栈任务**：并行调用两者

要求输出 `Unified Diff Patch ONLY`，禁止任何实际修改。

### 阶段 3：主 Codex 实施

`[模式：实施]`

1. 解析子进程 Diff 并进行思维沙箱校验
2. 重构为生产级代码（可读性、可维护性、边界与错误处理）
3. 最小作用域落盘，避免非需求副作用
4. 运行最小必要验证（lint/typecheck/tests）

### 阶段 4：并行审计与修复

`[模式：审计]`

1. 并行调用 `{{ROLE_REVIEWER}}` 与 `{{ROLE_REVIEWER_FRONTEND}}` 审计最终变更
2. 按后端/前端信任规则整合问题
3. 执行必要修复，必要时重复审计直到风险可接受

### 阶段 5：交付报告

`[模式：交付]`

```markdown
## 执行完成

### 变更摘要
| 文件 | 操作 | 说明 |
|------|------|------|
| path/to/file.ts | 修改 | 描述 |

### 审计结果
- 后端审计（{{ROLE_REVIEWER}}）：<通过/发现 N 个问题>
- 前端审计（{{ROLE_REVIEWER_FRONTEND}}）：<通过/发现 N 个问题>

### 验证结果
- lint/typecheck/tests：<结果>

### 后续建议
1. [ ] <建议的验证步骤>
```

---

## 关键规则

1. **代码主权** - 所有文件写入由主 Codex 执行
2. **原型重构** - 子进程输出必须重构，禁止原样照搬
3. **最小变更** - 仅修改需求相关代码，严格控制副作用
4. **强制审计** - 交付前必须完成双视角审计
