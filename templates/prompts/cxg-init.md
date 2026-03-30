# CXG Init - 初始化项目上下文

以「根级简明 + 模块级详尽」策略生成项目 `AGENTS.md` 文档体系。

## 使用方法

```bash
/prompts:cxg-init <项目摘要或名称>
```

## 上下文

- 项目摘要：$ARGUMENTS
- 目标：生成/更新根级与模块级 `AGENTS.md`
- 自动生成 Mermaid 结构图和导航面包屑

---

## 你的角色

你是**协调者**，负责调用子进程完成项目扫描与文档生成。

## 子进程调用规范

当项目规模大或模块复杂时，使用预置子 Agent 模板协同：

- 时间戳子 Agent：`{{AGENT_GET_CURRENT_DATETIME}}`
- 初始化架构子 Agent：`{{AGENT_INIT_ARCHITECT}}`
- 写入范围：只写文档（AGENTS.md 和 .codex/index.json等），不改业务源代码。

```text
# 步骤 1：获取时间戳
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{AGENT_GET_CURRENT_DATETIME}}
<TASK>
需求：获取当前时间戳，用于 AGENTS 文档变更记录
</TASK>
OUTPUT: YYYY-MM-DD HH:mm:ss
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "获取时间戳"
})

# 步骤 2：生成/更新 AGENTS 文档
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: {{AGENT_INIT_ARCHITECT}}
<TASK>
需求：扫描仓库并生成 AGENTS 文档草案
上下文：<项目摘要 + 仓库结构 + 时间戳 + 关键入口>
约束：只写文档（AGENTS.md 和 .codex/index.json等），不改业务源代码。
</TASK>
OUTPUT: 根级与模块级 AGENTS.md 草案（Markdown）
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "初始化文档草案"
})
```

---

## 执行工作流

**⚠️ 必须按以下步骤执行**

### 🕐 阶段 1：获取当前时间戳

**必须首先调用 `get-current-datetime` 子进程**：

按上方「子进程调用规范」中的**步骤 1：获取时间戳**示例执行。

等待返回时间戳后，保存为 `<TIMESTAMP>` 供后续使用。

### 🏗️ 阶段 2：调用初始化架构师

**使用 `init-architect` 子进程执行完整扫描**：

按上方「子进程调用规范」中的**步骤 2：生成/更新 AGENTS 文档**示例执行，并在输入上下文中注入 `$ARGUMENTS` 与 `<TIMESTAMP>`。

### 📊 步骤 3：汇总结果

子进程完成后，向用户展示：

```markdown
## 初始化结果摘要

### 根级文档
- 状态：[创建/更新]
- 主要栏目：<列表>

### 模块识别
- 识别模块数：X
- 模块列表：
  1. <模块路径>
  2. ...

### 覆盖率
- 已扫描文件：X / Y
- 覆盖模块：X%
- 跳过原因：<如有>

### 生成内容
- ✅ Mermaid 结构图
- ✅ N 个模块导航面包屑

### 推荐下一步
- [ ] 补扫：<路径>
```

---

## 安全边界

1. **只读/写文档** – 不改源代码
2. **忽略生成物** – 跳过 `node_modules`、`dist`、二进制文件
3. **增量更新** – 重复运行时做断点续扫

## 关键规则

1. **使用 Codeagent Wrapper**调用子进程，不要自己执行扫描逻辑
2. 先调用 `get-current-datetime` 获取时间戳
3. 再调用 `init-architect` 执行完整扫描
4. 结果在主对话打印摘要，全文由子进程写入仓库
