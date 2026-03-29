---
name: cxg-review
description: 'Migrated from custom prompt ''cxg-review''. Use when Codex should follow
  this prompt workflow: CXG Review - 多视角代码审查. Key intent: 使用 Codex 后端/前端双子进程并行审查，交叉验证后输出综合审查结论。.'
---

# CXG Review - 多视角代码审查

使用 Codex 后端/前端双子进程并行审查，交叉验证后输出综合审查结论。

## 使用方法

```bash
$cxg-review [代码或描述]
```

- 无参数：自动审查当前 `git diff HEAD`
- 有参数：审查指定文件、目录或代码片段

---

## 子进程调用规范

```text
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
审查以下代码变更：
<git diff 内容>
</TASK>
OUTPUT: 按 Critical/Major/Minor/Suggestion 分类列出问题
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "代码审查"
})
```

**角色提示词**：

| 审查视角 | 角色文件 |
|----------|----------|
| 后端/通用 | `{{ROLE_REVIEWER}}` |
| 前端/UI | `{{ROLE_REVIEWER_FRONTEND}}` |

**并行调用**：启动后台任务后，使用运行时可用的后台结果查询机制轮询。**必须等所有子进程返回后才能进入下一阶段**。

**重要**：
- 必须指定 `timeout: 600000`，否则默认只有 30 秒会导致提前超时。
- 若 10 分钟后仍未完成，继续轮询后台结果，绝对不要 Kill 进程。
- ⛔ **Codex 结果必须等待**：Codex 执行时间较长（5-15 分钟）属于正常。单次查询超时后必须继续轮询，**绝对禁止在 Codex 未返回结果时直接跳过或继续下一阶段**。已启动的 Codex 任务若被跳过 = 浪费 token + 丢失结果。

---

## 执行工作流

### 阶段 1：获取待审查代码

`[模式：研究]`

1. 无参数：执行 `git diff HEAD` + `git status --short`
2. 有参数：读取用户指定范围
3. 调用 `{{MCP_SEARCH_TOOL}}` 补充上下文

### 阶段 2：并行审查

`[模式：审查]`

并行调用两个子进程：
1. 后端/通用审查：`ROLE_FILE: {{ROLE_REVIEWER}}`
2. 前端/UI 审查：`ROLE_FILE: {{ROLE_REVIEWER_FRONTEND}}`

### 阶段 3：综合反馈

`[模式：综合]`

1. 合并并去重审查结果
2. 统一严重级别：Critical / Major / Minor / Suggestion
3. 对冲突意见按后端/前端信任规则裁决

### 阶段 4：呈现审查结果

`[模式：总结]`

```markdown
## 代码审查报告

### 审查范围
- 变更文件：<数量>
- 代码行数：+X / -Y

### 关键问题（Critical）
1. <问题描述> - [后端审查/前端审查]

### 主要问题（Major）
1. <问题描述>

### 次要问题（Minor）
1. <问题描述>

### 建议（Suggestion）
1. <优化建议>

### 总体评价
- 代码质量：<优秀/良好/需改进>
- 是否可合并：<是/否/修复后>
```

---

## 关键规则

1. **无参数即审查 git diff** - 自动获取当前变更
2. **双视角交叉验证** - 后端问题以后端角色为主，前端问题以前端角色为主
3. 子进程对文件系统**零写入权限**
