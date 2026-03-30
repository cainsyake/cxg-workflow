# CXG Init - 初始化项目上下文

以「根级简明 + 模块级详尽」策略生成项目 `AGENTS.md` 文档体系。

## 使用方法

```bash
/prompts:cxg-init <项目摘要或名称>
```

## 上下文

- 项目摘要：$ARGUMENTS
- 目标：生成/更新根级与模块级 `AGENTS.md`
- 输出包含结构图、模块索引、开发规范和覆盖率摘要

---

## 子进程调用规范（支持写入，受范围约束）

当项目规模大或模块复杂时，使用预置子 Agent 模板协同：

- 时间戳子 Agent：`{{AGENT_GET_CURRENT_DATETIME}}`
- 初始化架构子 Agent：`{{AGENT_INIT_ARCHITECT}}`
- 写入范围：仅允许更新 `AGENTS.md` 与 `.codex/index.json` 等文档资产，禁止修改业务源码。
- 执行约束：写入前回显白名单并获确认；写入后校验变更文件均在白名单范围内。

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
约束：只允许写 AGENTS.md 与 .codex/index.json
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

### 阶段 1：基础扫描

`[模式：扫描]`

1. 获取当前时间戳（用于文档更新时间）
2. 识别技术栈（语言、框架、构建工具）
3. 统计目录结构、入口文件、核心模块
4. 跳过生成物与大体积依赖目录（如 `node_modules`、`dist`）

### 阶段 2：模块级分析

`[模式：分析]`

对每个核心模块提取：
- 模块职责
- 入口与关键接口
- 依赖关系
- 测试与验证方式
- 已知约束与风险

### 阶段 3：生成文档

`[模式：生成]`

**根目录 `AGENTS.md` 建议结构**：

```markdown
# <项目名> — <一句话描述>

## 架构总览
<Mermaid 结构图>

## 模块索引
| 模块 | 职责 | 文档 |
|------|------|------|

## 运行与开发
### 常用命令
### 测试策略

## 编码规范
<从现有代码推断>
```

**模块级 `AGENTS.md` 建议结构**：

```markdown
# <模块名>

## 职责
## 入口
## 对外接口
## 依赖关系
## 相关文件
## 测试与验证
```

### 阶段 4：输出摘要

`[模式：报告]`

```markdown
## 初始化结果摘要

### 文档
- 根级 AGENTS.md: [创建/更新]
- 模块级 AGENTS.md: <数量>

### 覆盖率
- 扫描文件: X / Y
- 覆盖模块: X%
- 跳过目录: <列表>

### 推荐下一步
- [ ] <需要补充扫描的路径>
- [ ] <建议补充的模块文档>
```

---

## 安全边界

1. **只写文档** - 不修改业务源代码
2. **增量更新** - 已存在文档优先合并更新而非覆盖
3. **范围校验** - 写入后必须核验变更文件全部落在白名单内
4. **可追踪** - 明确标注扫描范围、覆盖率与未覆盖原因
