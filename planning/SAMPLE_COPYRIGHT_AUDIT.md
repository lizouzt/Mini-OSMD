# 乐谱样例版权核查

核查日期：2026-10-15。本文件既是本仓库的核查记录，也是后续乐谱文件的准入规则。执行开发计划的 Agent 必须遵守。

**适用范围。** 规则适用于以下两类内容：

- 我们对外发布的内容：npm 包、公开 demo 网站、截图和图片；
- 我们新增或修改的乐谱文件。

在 OSMD fork 中，上游原有的测试数据（与 `upstream/develop` 完全一致的文件）原样保留，不适用本规则，也不逐个核查。具体见 `DEVELOPMENT_PLAN.md` 阶段 1。

> 这是基于公开信息的技术核查，不构成法律意见。正式发布前建议由法务复核。

## 1. 准入规则

**原则：只收录有正面授权证据的文件。证据不足即视为不合规，直接移除，不做"可能没问题"的保留。**

| 等级 | 条件 | 处理 |
|---|---|---|
| A 合规 | 本项目自行编写；或 OSMD 团队编写并随其 BSD-3-Clause 仓库发布；或明确声明 CC0 / Public Domain 且来源可追溯；或派生自 W3C MusicXML 规范示例（W3C Community CLA 2.1 授予复制、修改、分发许可，2.2 要求注明规范名称与版本） | 保留，在清单中登记来源、许可与哈希；BSD-3 与 W3C 来源需附归属声明 |
| B 不合规 | `<rights>` / `<credit-words>` 声明第三方版权（如 "Copyright © Recordare LLC"、"MakeMusic, Inc."、"All rights reserved"）且无再分发授权；来自 MuseScore.com 等用户上传站点且无明确许可；受版权保护的现代作品（作曲、编曲、歌词）的编码 | 直接移除 |
| C 存疑 | 来源无法追溯、作者不明、文件元数据缺失且无法从提交历史确认作者 | 按 B 处理，直接移除 |

补充规则：

- 作品本身进入公有领域（如贝多芬）**不等于**该 MusicXML 编码可自由再分发；编码/排版者可能另有权利。判断依据是编码文件本身的授权，而不是作品年代。
- 歌词同样受版权约束，现代歌词按 B 处理。
- 新增测试文件优先自行编写最小化用例：版权最干净，也最容易被上游接受。
- W3C 示例派生文件必须在文件内（`<identification><miscellaneous>` 或 XML 注释）和 `THIRD_PARTY_NOTICES.md` 中写明："Derived from MusicXML 4.0 / 4.1 specification examples, W3C Music Notation Community Group, under the W3C Community Contributor License Agreement"。
- 每个保留文件都要登记 SHA-256，防止被替换成未核查的版本。

## 2. 本仓库核查结果（已执行）

| 文件 | 文件内版权信息 / 来源证据 | 等级 | 处理 |
|---|---|---|---|
| `Beethoven_AnDieFerneGeliebte.xml` | `<rights>Copyright © 2002 Recordare LLC</rights>`，Finale 2011 + Dolet 导出 | B | 已移除 |
| `Debussy_Mandoline.xml` | `<rights>Copyright © 2002 Recordare LLC</rights>` | B | 已移除 |
| `Dichterliebe01.xml` | `<rights>Copyright © 2002 Recordare LLC</rights>` | B | 已移除 |
| `BrahWiMeSample.musicxml` | `<rights>Copyright © 2002 MakeMusic, Inc.</rights>` | B | 已移除 |
| `Saltarello.mxl` | `<rights>Copyright © 2010 Recordare LLC</rights>` | B | 已移除 |
| `Parlez-moi.mxl` | `<source>http://musescore.com/user/13350351/scores/4886177</source>`，作曲 France Levasseur，无许可声明 | B | 已移除 |
| `Hello-World-in-MusicXML.md` | W3C MusicXML 教程的中文译文，缺少 CLA 2.2 要求的规范名称与版本归属；引用的 `../assets/01.jpg` 不存在；项目未使用 | B | 已移除 |
| `OSMD_function_test_all.xml` | OSMD 仓库 `test/data`，由 OSMD 维护者 sschmidTU 于 2018-07-19 提交 | A | 保留，登记于 `public/demo/README.md` |
| `Test_Auto_Multirest_2.musicxml` | OSMD 仓库 `test/data`，由 fredmeister77 于 2020-08-11 随 PR #861 提交 | A | 保留，同上 |
| `test_slurs_highNotes.musicxml` | OSMD 仓库 `test/data`，`<creator type="composer">OSMD</creator>`，sschmid 于 2020-11-24 提交 | A | 保留，同上 |
| `demo/main.ts` 内嵌 Built-in Test 乐谱 | 本项目自行编写 | A | 保留 |
| `test/MusicSheetReader.test.ts` 内嵌 XML | 本项目自行编写的最小用例 | A | 保留 |

关于 Recordare / MakeMusic 示例：其发布页 <https://www.musicxml.com/music-in-musicxml/example-set/> 只提供下载，没有任何再分发或修改授权条款，文件内版权声明仍然有效，因此判为 B。

被移除的文件同时从 `public/demo/` 和构建产物 `dist-lib/demo/` 删除。

## 3. 仍需人工决定的遗留问题

1. **git 历史。** 被移除的文件仍存在于本仓库 `main` 的历史提交以及远端分支 `feat/phase10` 中，且本仓库是公开的。只删除最新版本并不能让它们从公开仓库消失。若要彻底清除，需要用 `git filter-repo --invert-paths --path public/demo/<文件> --path dist-lib/demo/<文件>` 重写全部分支历史并强制推送，这会改变所有提交哈希。是否执行由仓库所有者决定，Agent 不得自行强制推送。
2. **GitHub Pages。** `npm run deploy` 曾可能把含这些文件的 `dist/` 发布到 `gh-pages`。远端目前没有 `gh-pages` 分支，如有其他部署位置需人工确认并清理。

## 4. 上游 OSMD 测试数据（不核查，仅作参考）

经仓库所有者决定，fork 中上游原有的 `test/data` 和 `demo/` 样例**原样保留，不逐个核查、不删除**，原因如下：

- 这些文件仍然留在继承来的 git 历史里，只在 fork 的最新版本中删除，效果有限；
- 删除会破坏上游的测试，也会增加同步上游时的冲突。

前提条件是：这些文件不进入任何发布内容，也就是 npm 包、公开 demo 和我们发布的截图里都不能有它们。

以下是对 OSMD `develop`（提交 a308225）的一次自动预扫描，只统计 `<rights>` 字段，用来提醒哪些文件**不能**被选进发布样例清单：

- 乐谱文件共 438 个（含 16 个 `.mxl`），其中 406 个没有 `<rights>` 字段；
- 11 个声明 Recordare LLC 版权，其中 7 个被单元测试引用；
- 明确写着 "All rights reserved" 的第三方作品，至少有 "© 2004 Polygames" 和 "© 1995 Dog Dream Music"；
- 12 个 `<rights>` 只有 "Copyright ©"，没有写明权利人；
- 3 个声明 CC0 或 Public Domain："OpenScore (CC0)"、"public domain"、"Public Domain (PianoXML typeset)"；
- 8 个带 `<source>` 字段，其中 5 个指向 musescore.com；
- 上游 `demo/` 目录中的 `BrahWiMeSample.musicxml`（MakeMusic 版权）和 `BrookeWestSample.musicxml`（Jonatha Brooke 的现代作品，只授权给 musicxml.com 展示）不得用于我们的公开 demo。

如果要从上游样例里挑文件放进发布内容，必须对那个文件单独按第 1 节的规则核查，并登记到 fork 的 `fork-docs/release-samples.csv`。
