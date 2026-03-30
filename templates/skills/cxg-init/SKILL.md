---
name: cxg-init
description: 'Skill workflow ''cxg-init''. Use when Codex should follow
  this skill workflow: CXG Init - 初始化项目上下文. Key intent: 以「根级简明 + 模块级详尽」策略生成项目 `AGENTS.md`
  文档体系。.'
---

# CXG Init - 初始化项目上下文

以「根级简明 + 模块级详尽」策略生成项目 `AGENTS.md` 文档体系。

## Input interpretation
用户在 `$cxg-init` 显式 skill 调用指令后的输入内容是**项目摘要或名称**。

## 使用方法

```bash
$cxg-init <项目摘要或名称>
```

## 上下文

- 项目摘要：<项目摘要或名称>
- 目标：生成/更新根级与模块级 `AGENTS.md`
- 输出包含结构图、模块索引、开发规范和覆盖率摘要

---

## 子进程调用规范（预置子agent模板）

`$cxg-init` 默认配合以下预置子agent提示词模板（均通过 `codeagent-wrapper` 调用）：

| 场景 | 子agent模板 |
|------|-------------|
| 时间戳获取 | `{{AGENT_GET_CURRENT_DATETIME}}` |
| 仓库扫描与文档草案 | `{{AGENT_INIT_ARCHITECT}}` |

标准调用语法：

```text
Bash({
  command: "{{WRAPPER_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <子agent提示词路径>
<TASK>
需求：<增强后的需求或阶段任务>
上下文：<项目摘要 + 已收集上下文>
</TASK>
OUTPUT: 期望输出格式
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "cxg-init 子进程协作"
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

建议先调用一次时间戳子agent：

```text
ROLE_FILE: {{AGENT_GET_CURRENT_DATETIME}}
OUTPUT: 原始时间戳字符串（例如 2026-03-30 10:21:00）
```

### 阶段 2：模块级分析

`[模式：分析]`

对每个核心模块提取：
- 模块职责
- 入口与关键接口
- 依赖关系
- 测试与验证方式
- 已知约束与风险

建议调用初始化架构子agent完成全仓扫描并输出草案：

```text
ROLE_FILE: {{AGENT_INIT_ARCHITECT}}
<TASK>
需求：扫描仓库并生成根级与模块级 AGENTS.md 草案
上下文：项目摘要：来自 Input interpretation 的原始项目摘要；时间戳：$TIMESTAMP；工作目录：{{WORKDIR}}
</TASK>
OUTPUT: 覆盖率报告 + AGENTS.md 草案
```

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
3. **可追踪** - 明确标注扫描范围、覆盖率与未覆盖原因
