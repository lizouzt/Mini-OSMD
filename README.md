# Mini-OSMD

A lightweight, clean-room implementation of a MusicXML renderer for the browser, inspired by OpenSheetMusicDisplay.

[中文文档](./README_zh.md)

## Features

- **MusicXML Support**: Renders `.xml` and `.musicxml` files.
- **VexFlow Integration**: Uses VexFlow for high-quality music engraving.
- **Interactive**: Support for cursor navigation (Left/Right arrow keys).
- **Lightweight**: Focused on core rendering capabilities.

## Installation

```bash
npm install mini-osmd
```

(Note: This package is currently in development and not yet published to npm. You can install it locally.)

## Usage

```typescript
import { OpenSheetMusicDisplay } from 'mini-osmd';

const container = document.getElementById('osmd-container');
const osmd = new OpenSheetMusicDisplay(container);

// Load a MusicXML string
const xml = `<?xml ... >`;
await osmd.load(xml);

// Render the score
osmd.render();

// Move cursor
osmd.cursor.next();
```

## Development & Demo

To run the project locally and view the demo:

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```
    Open your browser at the provided URL (usually `http://localhost:5173`).
    You can switch between different sample scores using the dropdown menu.

3.  **Build**:
    ```bash
    npm run build
    ```
    The output will be in the `dist/` directory.

## License

BSD-3-Clause