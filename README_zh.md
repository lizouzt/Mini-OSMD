# Mini-OSMD

一个基于浏览器运行的轻量级 MusicXML 渲染器，灵感来源于 OpenSheetMusicDisplay。

[English Documentation](./README.md)

## 特性

- **MusicXML 支持**: 支持渲染 `.xml` 和 `.musicxml` 格式的乐谱文件。
- **VexFlow 集成**: 使用 VexFlow 进行高质量的乐谱雕刻与绘制。
- **交互性**: 支持光标导航（通过左右方向键控制）。
- **轻量级**: 专注于核心渲染能力，代码结构清晰。

## 安装

```bash
npm install mini-osmd
```

(注意：本项目目前处于开发阶段，尚未发布到 NPM。您可以从本地安装或作为源码引用。)

## 使用方法

```typescript
import { OpenSheetMusicDisplay } from 'mini-osmd';

// 获取容器元素
const container = document.getElementById('osmd-container');
// 初始化实例
const osmd = new OpenSheetMusicDisplay(container);

// 加载 MusicXML 字符串
const xml = `<?xml ... >`;
await osmd.load(xml);

// 渲染乐谱
osmd.render();

// 移动光标
osmd.cursor.next();
```

## 开发与演示 (Demo)

要在本地运行项目并查看演示效果：

1.  **安装依赖**:
    ```bash
    npm install
    ```

2.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    在浏览器中打开提示的 URL（通常是 `http://localhost:5173`）。
    您可以通过页面左上角的下拉菜单切换不同的示例乐谱（包括贝多芬和勃拉姆斯的经典片段）。

3.  **构建**:
    ```bash
    npm run build
    ```
    构建产物将输出到 `dist/` 目录。

## 许可证

BSD-3-Clause
