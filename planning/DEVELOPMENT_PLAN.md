# 开发计划：基于 OSMD 的 MusicXML 4.0 / 4.1 支持

本文件交给执行开发的 AI Agent。按阶段顺序推进；"人工前置事项"未完成时，相关阶段不得开始。文中命令、文件路径均已在 OSMD `develop`（提交 a308225，版本 2.2.1-dev）上核实；上游变动后以实际代码为准。

## 0. 背景与目标

- 现有的 Mini-OSMD 是从零重写的约 1,600 行渲染器，连 MusicXML 3.x 基础语义都不完整（附点、变音记号、跨行延伸记号、谱号等），并且有示例在渲染时直接崩溃。项目决定**放弃自研引擎，改为基于上游 OpenSheetMusicDisplay（OSMD）开发**。
- 目标：
  1. 让 OSMD 完整支持 MusicXML 4.0，并跟进 4.1 草案；
  2. 每个特性以独立 PR 提交到上游 `opensheetmusicdisplay/opensheetmusicdisplay` 的 `develop` 分支；
  3. 以开源项目形式发布我们的 fork（含尚未被上游合并的特性）。
- 非目标：重构 OSMD、改变 OSMD 的公共 API 风格、更换 VexFlow 版本。

## 1. 不可更改的决策

1. **git fork，不拷贝。** 必须保留上游完整历史，以便持续合并上游更新、向上游提 PR。
2. **最小侵入。** 不重命名、不移动、不重新格式化上游已有代码；不做与当前特性无关的改动。新逻辑尽量放在新文件或新方法里，在原有代码里只加必要的调用。
3. **许可证。** 上游是 BSD-3-Clause（Copyright 2019 PhonicScore）。保留其 `LICENSE` 原文；我们新增的代码同样用 BSD-3-Clause，方便合并进上游。不得以 PhonicScore 或 OSMD 贡献者的名义为我们的发布物背书；发布名称不得暗示是官方版本。
4. **乐谱文件准入。** 严格执行同目录下的 `SAMPLE_COPYRIGHT_AUDIT.md`：没有正面授权证据的文件一律不收录，已有的直接移除。
5. **禁止事项。** 不得强制推送、改写共享分支历史、合并或关闭任何 PR，除非仓库所有者明确授权。

## 2. 人工前置事项（Agent 无法代办）

| 编号 | 事项 | 原因 | 阻塞阶段 |
|---|---|---|---|
| H1 | 在 GitHub 上把 `opensheetmusicdisplay/opensheetmusicdisplay` fork 到 `lizouzt` 账号下 | GitHub 只允许同一 fork 网络内的仓库向上游提 PR；当前 `lizouzt/Mini-OSMD` 不是 fork | 全部 |
| H2 | 决定 `lizouzt/Mini-OSMD` 的去向。建议：在 README 顶部指向新 fork，然后归档 | 避免两个项目并存造成混淆 | 阶段 6 |
| H3 | 决定是否重写 Mini-OSMD 的 git 历史，清除已移除的乐谱文件（见核查文档第 3 节） | 需要强制推送，只能由所有者执行 | 阶段 6 |
| H4 | 确定 npm 包名，例如 `@lizouzt/osmd-musicxml4`；不能用 `opensheetmusicdisplay` | 包名被占用，且不能暗示官方 | 阶段 6 |
| H5 | 对较大的设计（阶段 3 的工作包 WP-2、WP-8）先在上游开 issue 或 discussion 征求维护者意见 | 提高 PR 被接受的概率 | WP-2、WP-8 |

## 3. 仓库与分支模型（fork 内）

```
upstream = https://github.com/opensheetmusicdisplay/opensheetmusicdisplay.git
origin   = https://github.com/lizouzt/opensheetmusicdisplay.git   （H1 创建的 fork）
```

| 分支 | 内容 | 规则 |
|---|---|---|
| `develop` | 与 `upstream/develop` 完全一致 | 只做 fast-forward 同步，永远不提交 |
| `feat/mxl4-<特性>` | 从最新 `upstream/develop` 切出，只含一个特性 | 用来向上游提 PR；不得包含合规删除、发布配置等 fork 专属改动 |
| `release`（fork 默认分支） | `upstream/develop` + 我们的特性 + fork 专属提交 | 对外发布用；定期 `git merge upstream/develop` |

fork 专属提交只有三类，各自独立成提交，方便合并时识别：

- 阶段 1 的合规删除；
- 发布配置（包名、README、NOTICE、CI）；
- 尚未被上游合并的特性分支的 merge 提交。

同步节奏：上游每次发版或每两周至少一次，把 `upstream/develop` 合并进 `release`，并跑全部测试。上游合并我们的某个 PR 后，`release` 里对应的改动会自然重合；如有冲突，以上游版本为准。

## 4. 环境与命令

- Node：ESLint 10 要求 Node ≥ 20.19 / 22.13 / 24，上游 CI 用 Node 24。
- `npm install` 会触发 `prepare`（husky + `npm run build`，其中 build = lint + webpack），首次安装较慢。
- 单元测试：`npm test`（Karma + Mocha，浏览器是 **FirefoxHeadless**，环境里需要装 Firefox）。测试文件放在 `test/**`，用 chai 断言，可参考 `test/MusicalScore/ScoreIO/MusicSheetReader_Test.ts`。
- 代码风格：`npm run lint`。
- 视觉回归：`npm run test:visual:build`。它依赖 devDependency `canvas`，生成到 `visual_regression/current`，与 `visual_regression/blessed` 比对。基线用 `npm run generate:blessed` 在**未改动的** `develop` 上生成。
- `generateImages_browserless.mjs` 的第二个参数是样例目录，可以只对我们的新文件出图：`node ./test/Util/generateImages_browserless.mjs ../../build ./test/data ./export png 0 0 ^test_mxl4`（最后一个参数是文件名正则）。
- Schema 校验：新增的测试文件必须通过 W3C XSD 校验：

```bash
git clone --depth 1 https://github.com/w3c-cg/musicxml.git /tmp/w3c-musicxml
xmllint --noout --schema /tmp/w3c-musicxml/schema/musicxml.xsd test/data/test_mxl4_*.musicxml
```

  XSD 不要复制进仓库，在脚本或 CI 里临时拉取。

- 提交信息沿用上游的 conventional commits，例如 `feat(MusicXML4): read for-part transposition`；上游用 conventional-changelog 生成 CHANGELOG。

## 5. 阶段

每个阶段结束时，在 fork 里更新 `fork-docs/musicxml4-support-matrix.md`（阶段 2 创建），并在对应 PR 描述里写明验证方式和结果。

### 阶段 0：建立 fork 与基线

1. 克隆 H1 的 fork，添加 `upstream` remote，从 `upstream/develop` 创建 `release` 分支并推送。设为默认分支需要仓库所有者在 GitHub 设置里操作，Agent 只需提醒。
2. 在干净的 `develop` 上跑通 `npm install`、`npm run lint`、`npm test`、`npm run generate:blessed`，记录测试数量、耗时和失败项。上游本身失败的用例要记下来，不要去修。
3. 把 Mini-OSMD 仓库 `planning/` 下的 `DEVELOPMENT_PLAN.md`、`SAMPLE_COPYRIGHT_AUDIT.md` 复制到 fork `release` 分支的 `fork-docs/` 目录。fork 专属文档统一放在 `fork-docs/`：上游 `.gitignore` 忽略了 `docs`，而修改上游文件会违反最小侵入原则。

**验收**：`release` 与 `upstream/develop` 只差文档提交；基线测试结果已记录。

### 阶段 1：fork 内乐谱文件合规清理（只在 `release` 分支）

1. 写脚本 `tools/audit-samples.mjs`，遍历 `test/data`、`demo/` 及其他目录下所有 `.xml/.musicxml/.mxl`（`.mxl` 需要解压读取 rootfile），输出 `fork-docs/sample-audit.csv`，列包括：文件名、`<rights>`、`<creator>`、`<source>`、`<software>`、含版权字样的 `<credit-words>`、首次提交人和日期（`git log --diff-filter=A --format='%an %ad' -- <file>`）、被哪些测试和 demo 引用、SHA-256。
2. 按核查文档的 A/B/C 规则逐个判定，写入 CSV 的"等级""依据"两列。预扫描结论见核查文档第 4 节：Recordare 版权文件、"All rights reserved" 文件、musescore.com 来源文件都是重点。现代流行作品（即使元数据为空）按 B 处理。
3. 在**一个独立提交**里删除全部 B/C 文件，并处理引用：
   - 单元测试：引用被删文件的用例（预扫描至少 7 个引用 Recordare 文件）要么改用 A 级文件重写断言，要么用 Mocha 的 `it.skip` 跳过，并在注释里写明"样例因版权移除"。不得删除上游的测试逻辑本身。
   - demo 的样例下拉列表：删除对应条目。
   - 视觉回归基线：删除对应图片后重新生成 blessed。
4. 增加 `tools/check-samples.mjs` 并加入 fork 的 CI：仓库里任何乐谱文件如果不在 `fork-docs/sample-audit.csv` 中被登记为 A 级，或者 SHA-256 对不上，CI 就失败。
5. 上游以后新增的样例文件在合并进 `release` 时会被这个检查拦下，按同样流程核查。
6. 这些改动**绝不进入** `feat/mxl4-*` 分支或上游 PR。

**验收**：`check-samples` 通过；`npm test` 与基线相比，除明确跳过的用例外没有新增失败；B/C 文件清单与删除提交一致。

### 阶段 2：4.0 / 4.1 支持现状矩阵

1. 以 `/tmp/w3c-musicxml/docs/src/pages/version-history/40.md`、`41.md` 和 `schema/musicxml.xsd` 为准，列出所有新增元素、属性、取值和弃用项。下面第 6 节是根据源码 grep 得到的初步结论，**只能作为线索**，必须用实际运行验证。
2. 每一项写一个最小测试文件 `test/data/test_mxl4_<特性>.musicxml`，要求：
   - 本项目自行编写；
   - `version="4.0"` 或 `"4.1"`；
   - 通过 XSD 校验；
   - 写明预期渲染效果（放在 `<identification><miscellaneous>` 里）。
3. 逐项判定为：完整支持 / 部分支持 / 不支持 / 忽略但不报错 / 报错。判定依据是解析结果、渲染图片和控制台报错，不是 grep 结果。
4. 输出 `fork-docs/musicxml4-support-matrix.md`：每项写明规范链接、测试文件、判定结果、证据（截图路径或断言）、对应的工作包编号。

**验收**：矩阵覆盖 40.md 和 41.md 中每一条 Schema 变更；每条都有测试文件和证据。

### 阶段 3：特性实现（每个工作包一个分支、一个上游 PR）

通用流程（每个工作包都要走完）：

1. 从最新 `upstream/develop` 切出 `feat/mxl4-<特性>`。
2. 先写失败的单元测试（解析层断言），再实现。
3. 只改与该特性相关的代码，风格与周边一致，`npm run lint` 必须通过。
4. 跑 `npm test` 和视觉回归：
   - 新测试文件的图片符合预期；
   - 已有样例的图片**零差异**；如果有预期内的差异，在 PR 里逐张说明。
5. 提交 PR 到上游 `develop`。PR 描述包括：规范条目链接、改动说明、测试文件、前后对比截图、视觉回归结果。
6. 同时把该分支合并进 fork 的 `release`。

工作包按优先级排列（影响渲染的在前）：

| 编号 | 内容 | 规范依据 | 预计改动位置 | 验收要点 |
|---|---|---|---|---|
| WP-1 | MXL 4.0 打包：`mimetype` 文件；`container.xml` 中多个 rootfile 时选主乐谱（第一个 MusicXML 媒体类型的 rootfile）；`part-link` 指向的分谱文件至少不报错，可选提供加载分谱的 API | 40.md "Packaging Changes"，`container.xsd`，`<part-link>` | `src/Common/FileIO/Mxl.ts`（目前固定读第一个 `rootfile`） | 含分谱的 4.0 `.mxl` 能正确加载主乐谱；旧 `.mxl` 行为不变 |
| WP-2 | 音乐会调乐谱：`<concert-score>`、`<for-part>`、`<part-clef>`、`<part-transpose>`；增加选项，在"音乐会调 / 移调分谱"两种视图之间切换 | 40.md；Issue 39 / 55 / 279 | `InstrumentReader.ts`（attributes 解析，目前只读 `<transpose>`）、`MusicSheetReader.ts`（defaults）、`src/Plugins/Transpose`、`OSMDOptions` | 带 for-part 的单簧管 / 圆号乐谱，两种视图下谱号和音高都正确；不带这些元素的文件行为不变。先完成 H5 |
| WP-3 | 踏板 `type="discontinue"`、`type="resume"` | 40.md "New Values" | `MusicSymbolModules/ExpressionReader.ts` 的 pedal `switch`（目前只处理 start / stop / change / continue） | 两种取值的渲染符合规范说明 |
| WP-4 | 和弦标记：`numeral-*` 全部子元素、`harmony@arrangement` / `bass@arrangement`、`<bass-separator>`、`inversion@text`；确认已弃用的 `<function>` 仍兼容 | 40.md；Issue 295 / 307 | `MusicSymbolModules/ChordSymbolReader.ts`、和弦标记绘制代码 | 罗马数字 / 纳什维尔级数、上下 / 斜线排列正确 |
| WP-5 | 小节号：`<measure-numbering>` 及 `staff`、`system`、`multiple-rest-always`、`multiple-rest-range` 属性 | 40.md；Issue 23 / 310 | 目前源码中没有读取 `measure-numbering`；映射到 `EngravingRules` 中已有的小节号选项 | none / measure / system 三种模式和多小节休止范围显示正确 |
| WP-6 | 其他影响渲染的 4.0 属性和元素：`arpeggiate@unbroken`、`repeat@after-jump`、`metronome@print-object`、`direction` / `ending` / `harmony` 的 `@system`、`staff-size@scaling`、`<line-detail>`、`<staff-divide>`、`enclosure="inverted-bracket"`、`credit-type` 的 "part name" 值、`number-level` 上限提高到 16、`wavy-line` 等元素的 `@smufl` | 40.md "New Attributes / New Values" | `VoiceGenerator.ts`、`RepetitionInstructionReader.ts`、`ExpressionReader.ts`、`InstrumentReader.ts` 及对应的图形类 | 每项都有测试文件；上游不打算支持的项在矩阵中注明 |
| WP-7 | 4.1 草案：`<part-symbol>` 可出现多次；barline 中 `<coda>` / `<segno>` 可出现多次；`<accidental>` / `<key-accidental>` 可出现多次（微分音）；`<voice-direction(s)>`；`harmonic@number`；timewise 格式已弃用（可选：用 W3C 的 `timepart.xsl` 转换后加载，或者给出明确报错） | 41.md | 对应 reader | 4.1 仍是草案，PR 描述里注明规范状态；如果上游希望等到正式发布，就只保留在 fork |
| WP-8 | 只涉及数据、不影响渲染的 4.0 元素：`<listen>`、`<assess>`、`<wait>`、`<other-listen>`、`<listening>`、`<sync>`、`<other-listening>`、`<player>`、`<instrument-change>`、一个音符多个 `<instrument>`、`<swing>`（`straight` / `first` / `second` / `swing-type` / `swing-style`） | 40.md；Issue 283 / 293 / 294 / 277 | 解析后挂到 `Note`、`SourceMeasure`、`Instrument` 等模型上，并提供只读 getter；不改绘制 | 解析结果有单元测试覆盖；渲染零差异。先完成 H5，确认上游希望的数据模型 |
| WP-9 | 弃用与容错：`clef sign="none"`、空的 `<multiple-rest>`、`<function>`：解析时不崩溃，给出 `log.warn` | 40.md "Removed and Deprecated"、41.md | 对应 reader | 不报错，有警告 |

### 阶段 4：回归与兼容

1. 在全部 A 级样例和全部 `test_mxl4_*` 文件上跑视觉回归，确认没有意外差异。
2. 准备一组 4.0 真实导出文件来验证兼容性：只能用我们自己在 MuseScore 4、Dorico、Sibelius、Finale 里新建并导出的文件，内容必须是自写的旋律或公有领域旋律（且由我们自行录入），按 A 级登记；不要直接下载别人的乐谱文件。
3. 性能：选一个大乐谱，对比改动前后的加载和渲染时间（上游有 `test/performance` 可参考），回退不超过 5%。

### 阶段 5：上游协作

- 一个 PR 只做一个工作包；如果 PR 太大，比如 WP-6，再按属性拆分。
- 对维护者的评审意见：按意见修改，不要争论风格问题。上游合并后，`release` 下次同步时会自然重合。
- 如果某个 PR 被拒绝或长期没人处理，就只保留在 `release`，并在支持矩阵里注明"仅 fork"。

### 阶段 6：开源发布（fork 的 `release` 分支）

1. README：说明项目基于 OSMD、与上游的关系、MusicXML 4.0 / 4.1 支持矩阵链接；不得暗示是官方版本。
2. `LICENSE` 保留上游原文，另加我们的版权行；`THIRD_PARTY_NOTICES.md` 列出 OSMD（BSD-3）、VexFlow（MIT）、jszip（MIT，选用其 MIT 许可）、loglevel（MIT）、typescript-collections（MIT），以及 W3C 派生测试文件的归属声明。
3. npm 包名使用 H4 确定的名字。上游 `package.json` 的 `files` 字段只包含 `build/dist/src`、`build/opensheetmusicdisplay.min.js`、`AUTHORS`、`CHANGELOG.md`、`README.md`、`external`，不含 `test/data`；保持这一点，并用 `npm pack --dry-run` 确认包里没有乐谱文件。
4. 公开 demo 只能使用 A 级文件。
5. fork 的 CI 跑：lint、`npm test`、`check-samples`、新测试文件的 XSD 校验、视觉回归。
6. 完成 H2 / H3 后，在 Mini-OSMD 的 README 顶部指向新项目。

## 6. 初步现状（grep 结果，阶段 2 必须实测确认）

在 OSMD `src/` 中按带引号的元素名检索：

- **完全没有命中**：`for-part`、`part-clef`、`part-transpose`、`concert-score`、`instrument-change`、`player`、`part-link`、`staff-divide`、`swing`、`listen`、`listening`、`measure-numbering`、`multiple-rest-always`、`unbroken`、`arrangement`、`bass-separator`、`after-jump`、`part-symbol`、`key-accidental`、`voice-direction`、`line-detail`、`staff-size`、`score-timewise`、`figured-bass`、`inverted-bracket`、`smufl`。
- **已有基础**：
  - `numeral`：`ChordSymbolReader.ts` 已读取 `numeral-root`；
  - `transpose`：`InstrumentReader.ts` 只用于播放移调；
  - `pedal`：只处理 start / stop / change / continue；
  - `arpeggiate`：在 `VoiceGenerator.ts` 中处理；
  - `harmonic`：在 `ArticulationReader.ts` 中处理；
  - MXL：读取 `container.xml` 的第一个 `rootfile`；
  - 乐谱格式：只接受 `score-partwise`。

## 7. 风险

| 风险 | 应对 |
|---|---|
| 上游迭代快（近 12 个月 501 次提交），容易冲突 | 坚持最小侵入；`release` 至少每两周同步一次；特性分支提 PR 前先 rebase 到最新 `upstream/develop` |
| 上游拒绝或长期不处理 PR | 只保留在 fork；在支持矩阵里标注 |
| OSMD 用的是打过补丁的 VexFlow 1.2.93（`src/VexFlowPatch`），新符号可能需要修改补丁 | 修改补丁时遵循上游 `prebuildVexflow` 的机制，不要升级 VexFlow |
| 测试环境依赖 FirefoxHeadless 和 node-canvas | 阶段 0 先把环境配好，并记录安装步骤 |
| 4.1 仍是草案，可能变化 | WP-7 最后做；PR 描述里写明草案状态 |
| 乐谱版权判断有误 | 严格执行"证据不足即移除"；发布前请法务复核 `fork-docs/sample-audit.csv` |

## 8. 完成定义

- 支持矩阵中 4.0 的每一项都是"完整支持"，或者有明确理由标为"仅数据"或"不支持"；4.1 草案各项都有结论。
- 每个工作包都有：测试文件（通过 XSD 校验）、单元测试、视觉回归证据、上游 PR 链接（或"仅 fork"的说明）。
- fork 的 `release` 分支 CI 全绿，`check-samples` 通过，`npm pack --dry-run` 中没有乐谱文件。
- 发布物包含完整的许可证与第三方声明。
