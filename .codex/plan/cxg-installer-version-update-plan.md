# CXG Installer/Binary 可靠性 + Version/Update 原子回滚实施计划（方案B）

## 1. 分析（Problem Analysis）

### 1.1 目标范围
1. 为 `cxg-workflow` 同步二进制安装可靠性能力：双源下载、重试、校验、预检/后检、失败告警。
2. 增加 `cxg version` 与 `cxg update`，并提供原子回滚流程，避免更新失败导致不可用。
3. 保持 CXG 单模型定位，不引入 CCG 的复杂多分支逻辑与历史兼容包袱。

### 1.2 当前差距（相对方案B目标）
1. `src/utils/binary.ts` 仅单源下载，无 timeout/retry/checksum。
2. `src/utils/installer.ts` 缺少 preflight/postflight 与可复用告警能力。
3. `src/cli-setup.ts`、`src/commands/menu.ts` 尚未暴露 `version/update`。
4. 缺少 `src/utils/version.ts` 与 `src/commands/update.ts`。
5. `src/commands/doctor.ts` 对 binary 的检查维度不足（无来源/校验状态提示）。

### 1.3 非目标（明确边界）
1. 不引入 CCG 的多模型路由配置与交互重配置。
2. 不引入历史目录迁移逻辑。
3. 不做全局 npm 安装检测与引导分支。

## 2. 架构决策（Architecture Decision）

### 2.1 模块边界
1. `utils/constants.ts`：只负责可靠下载的静态配置（源列表、tag、默认 timeout、重试次数）。
2. `utils/binary.ts`：二进制生命周期核心（下载策略、校验、verify、失败告警渲染）。
3. `utils/installer.ts`：安装编排（preflight -> install assets -> install/verify binary -> postflight）。
4. `utils/version.ts`：版本读取与比较（current/local/latest/check）。
5. `commands/update.ts`：原子更新编排（backup -> install -> verify -> cleanup/rollback）。
6. `commands/version.ts`：版本可见性入口（包版本、本地 workflow 版本、binary 版本/健康）。
7. `commands/doctor.ts`：运行时诊断，不承载安装逻辑，仅消费 `binary/version/config` 能力。

### 2.2 核心决策
1. 复用现有 `installCxg` 作为 update 安装执行器，避免重复安装实现。
2. 下载策略采用“源级 fallback + 源内 retry”，而非并发竞速，降低复杂度与调试成本。
3. 校验采用两层：`checksum(可选)` + `--version` 可执行性验证。
4. update 采用目录级原子切换（move 备份目录）+ 失败时 best-effort 恢复。
5. 保持 CLI 风格与现有中英文文案习惯，不引入新交互框架。

### 2.3 数据与流程
1. `init` 流程：`preflight -> install templates -> install binary -> postflight -> save config`。
2. `update` 流程：`check version -> backup targets -> force install -> verify -> success cleanup | failure rollback`。
3. `doctor` 流程：读取 config + 关键文件存在性 + binary 执行性 + 更新修复建议。

## 3. 逐文件变更清单（新增/修改）

| 文件 | 类型 | 变更要点 |
|---|---|---|
| `src/utils/constants.ts` | 修改 | 增加 `BINARY_SOURCES`（GitHub + Mirror）、timeout/retry 常量、release 页面常量 |
| `src/utils/binary.ts` | 修改 | 增加 `downloadFromUrl`、fallback 下载、退避重试、`verifyBinaryChecksum`、`showBinaryDownloadWarning` |
| `src/utils/installer.ts` | 修改 | 增加 preflight/postflight；binary 安装改为“已有可用即跳过，损坏则重装”；暴露 update 复用点 |
| `src/utils/config.ts` | 修改 | 扩展配置写入字段（如 binary 最后校验时间/来源/状态，可选） |
| `src/types/index.ts` | 修改 | 扩展 `InstallResult`、`CxgConfig`（binary 元信息）与 update 相关结果类型 |
| `src/utils/version.ts` | 新增 | `getCurrentVersion/getLatestVersion/compareVersions/checkForUpdates` |
| `src/commands/version.ts` | 新增 | 输出 package 版本、本地配置版本、binary 版本与健康状态 |
| `src/commands/update.ts` | 新增 | 原子更新与回滚实现；复用 installer + binary verify + warning |
| `src/commands/init.ts` | 修改 | 接入统一 binary 告警函数，优化失败提示与后续动作 |
| `src/commands/doctor.ts` | 修改 | 增加 binary 校验状态细分与修复建议 |
| `src/commands/menu.ts` | 修改 | 增加菜单项：`version`、`update` |
| `src/cli-setup.ts` | 修改 | 注册 `version`、`update` 命令与参数 |
| `src/index.ts` | 修改 | 导出 `version/update` 与 version utils（如需要对外 API） |
| `src/types/cli.ts` | 修改 | 为 `update` 增加可选参数类型（如 `--force`/`--yes`，按最小集） |
| `src/utils/__tests__/binary.test.ts` | 新增 | 下载 fallback/retry/checksum/verify/warning 单测 |
| `src/utils/__tests__/version.test.ts` | 新增 | 版本比较与更新检测单测 |
| `src/utils/__tests__/installer.test.ts` | 修改 | preflight/postflight 与 binary 安装分支测试 |
| `README.md` | 修改 | 新增 `cxg version/update` 使用方式与回滚行为说明 |
| `README.zh-CN.md` | 修改 | 同步中文文档 |

## 4. 分阶段实施步骤（可执行清单）

### Phase 0：基线与契约
- [ ] 定义 `BINARY_SOURCES`、retry/timeout 常量与类型。
- [ ] 约定 `InstallResult` 与配置元数据字段（新增字段默认可空，保证向后兼容）。
- [ ] 明确 update 备份目录命名：`*.cxg-update-bak`。
- [ ] 验收：`pnpm typecheck` 通过。

### Phase 1：Binary 可靠下载能力
- [ ] 在 `binary.ts` 增加单源下载函数（支持超时与 AbortController）。
- [ ] 实现源内重试（指数或线性退避）与源间 fallback。
- [ ] 加入可选 checksum 校验（若 checksum 缺失则降级为可执行验证）。
- [ ] 实现统一 `showBinaryDownloadWarning()`，包含手动下载与放置路径指引。
- [ ] 验收：binary 单测全部通过。

### Phase 2：Installer 预检/后检闭环
- [ ] preflight：模板目录存在性、目标目录可写性、平台/架构可识别。
- [ ] binary 安装流程改造：已存在且可执行则跳过；不可执行则覆盖重装。
- [ ] postflight：至少安装到最小命令集、binary 状态可判定、错误可归因。
- [ ] init 侧接入 warning 与更明确的下一步提示。
- [ ] 验收：`pnpm test` 中 installer 场景覆盖通过。

### Phase 3：Version 能力
- [ ] 新增 `utils/version.ts`，实现 current/latest/local 三版本读取。
- [ ] 增加 semver 比较函数与网络失败降级策略。
- [ ] 新增 `commands/version.ts` 输出版本矩阵与健康状态。
- [ ] CLI 与菜单挂载 `version`。
- [ ] 验收：`cxg version` 在离线/在线都能给出可理解输出。

### Phase 4：Update + 原子回滚
- [ ] 新增 `commands/update.ts`。
- [ ] 实现目录备份：`prompts/cxg*`、`skills/cxg`、`.cxg/roles`（按 CXG 实际目录）。
- [ ] 调用安装逻辑执行更新（force），成功后执行 post-verify。
- [ ] 失败路径执行 rollback：清理半安装产物并恢复备份目录。
- [ ] 成功路径清理备份，并在 binary verify 失败时触发 warning（非静默）。
- [ ] CLI 与菜单挂载 `update`。
- [ ] 验收：故障注入下可回滚到可用状态。

### Phase 5：文档与验收
- [ ] README/README.zh-CN 增加 `version/update` 与失败恢复说明。
- [ ] `doctor` 输出与文档中的修复指引保持一致。
- [ ] 全量验证：`pnpm lint && pnpm typecheck && pnpm test && pnpm build`。
- [ ] 验收：新命令可发现、可执行、可回滚、可诊断。

## 5. 测试计划（单测 + 手工验证）

### 5.1 单元测试
1. `binary.test.ts`
   - 双源 fallback：主源失败，次源成功。
   - 源内 retry：前 N 次失败后成功。
   - timeout 触发与 abort 行为。
   - checksum 匹配/不匹配分支。
   - `verifyBinary` 成功/失败分支。
   - warning 文案包含平台文件名与目标路径。
2. `version.test.ts`
   - `compareVersions` 常规与边界（`1.7` vs `1.7.0`）。
   - npm 查询失败时 `latestVersion=null`。
   - 本地 workflow 版本落后判定。
3. `installer.test.ts` 扩展
   - preflight 失败时快速返回并给出错误。
   - postflight 检测“安装过程无产物”并失败。
   - 已有可执行 binary 时跳过下载。
   - 已有损坏 binary 时触发重装。

### 5.2 手工验证
1. 在线安装：`pnpm dev init --force`，确认 binary 下载成功并通过 `doctor`。
2. 主源故障演练：模拟主源不可达，确认次源可拉起安装。
3. 双源故障演练：确认出现明确 warning 与手动修复指引。
4. 更新成功路径：`pnpm dev update`，确认版本变化、备份被清理。
5. 更新失败路径：注入安装失败（测试开关或 mock），确认自动回滚且命令仍可用。
6. 版本命令：`pnpm dev version`，检查 package/local/binary 三项输出一致性。

## 6. 风险与回滚策略

### 6.1 风险清单
1. 镜像可用性风险：次源失效或延迟波动导致安装时间变长。
2. 文件系统原子性差异：Windows 下 move/rename 可能受锁文件影响。
3. 半安装状态：更新中断导致目录部分写入。
4. 版本探测依赖 npm：离线场景无法判断 latest。
5. 校验策略不一致：某些发布物暂缺 checksum 文件。

### 6.2 缓解策略
1. 统一 timeout + retry + fallback，错误信息带来源与次数。
2. 回滚使用“先备份再安装”，且 restore 为 best-effort 多次尝试。
3. `doctor` 增强为可修复导向，输出明确命令与路径。
4. latest 不可得时降级为本地状态报告，不阻断 `version`。
5. checksum 缺失时降级 `--version` 验证并提示“弱校验”状态。

### 6.3 回滚策略
1. 更新前移动旧目录到 `*.cxg-update-bak`。
2. 安装失败或后检失败，删除新产物并恢复备份目录。
3. 恢复后立即执行 `verifyBinary` 与最小命令检查。
4. 无论成功/失败都输出下一步建议（重试/手动修复）。

## 7. CCG 逻辑裁剪清单与原因

1. 裁剪“全局 npm 安装检测 + 建议用户改用 npm -g 更新”分支。
   - 原因：CXG 目标是简洁单模型工具，保持 `npx/pnpm dev` 一致路径更可控。
2. 裁剪“历史目录迁移（needsMigration/migrateToV1_4_0）”。
   - 原因：CXG 当前版本演进简单，尚无复杂历史结构债务。
3. 裁剪“多模型路由重配置交互”。
   - 原因：与 CXG 单模型定位冲突，增加用户认知负担。
4. 裁剪“Windows npx 缓存清理专有流程”。
   - 原因：复杂度高、收益有限，先依赖标准重试与明确错误提示。
5. 裁剪“重 i18n/多终端交互分支与复杂 spinner 状态机”。
   - 原因：当前 CLI 风格已稳定，优先可靠性与可测试性。

## 8. 验收标准（Definition of Done）

1. `cxg version` 与 `cxg update` 命令可用，菜单可达。
2. binary 下载具备双源 + retry + timeout，并在失败时可告警。
3. installer 具备 preflight/postflight，失败不再静默。
4. update 失败会自动回滚，回滚后命令仍可运行。
5. 文档与 doctor 输出一致，用户可按提示自助修复。
6. CI 基线通过：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
