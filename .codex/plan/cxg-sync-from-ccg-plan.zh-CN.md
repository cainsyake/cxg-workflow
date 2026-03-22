# CXG 同步与差异文档计划（ccg-workflow -> cxg-workflow）

## 目标

- 新增一份中文文档，集中记录从 `ccg-workflow` 同步到 `cxg-workflow` 的内容。
- 明确 `ccg-workflow` 与 `cxg-workflow` 的关键差异矩阵。
- 仅做文档变更，不修改代码逻辑。

## 范围与约束

- 仅维护中文版本，不新增英文同步文档。
- `README.zh-CN.md` 增加入口链接。
- `README.md` 保持不变。

## 实施步骤

1. 新增 `SYNC-FROM-CCG.zh-CN.md`，包含同步清单、差异矩阵、维护规则。
2. 在 `README.zh-CN.md` 增加“同步与差异记录”入口。
3. 自检链接与事实锚点是否可回溯到现有文件。
4. 验收完成后，在 `SYNC-FROM-CCG.zh-CN.md` 中补充本次更新记录（日期/触发原因/影响条目/结论）。

## 变更文件

- 新增：`SYNC-FROM-CCG.zh-CN.md`
- 修改：`README.zh-CN.md`

## 验收标准

- 文档完整回答“同步了什么、差异是什么、何时更新”。
- `README.zh-CN.md` 可直接跳转到同步文档。
- 不涉及 `src/**` 代码逻辑变更。
