# VidCompare

A high-performance desktop application for identifying and removing duplicate videos and images from your local storage. Built with Electron, React, and TypeScript.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Electron](https://img.shields.io/badge/electron-29.0.0-47848f.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)

## Features

- **Dual Mode Scanning**: Switch between video and image duplicate detection
- **Visual Fingerprinting**: Uses perceptual hashing to find visually similar files, not just exact matches
- **Name-Based Matching**: Detects files with similar names that may be duplicates
- **Synchronized Comparison**: Side-by-side comparison with synchronized playback for videos and synchronized pan/zoom for images
- **Smart Suggestions**: Automatically identifies the "best quality" file in each duplicate set
- **Safe Deletion**: Files are moved to Trash, never permanently deleted
- **Modern UI**: Clean, cinematic dark theme with smooth animations

## Screenshots

The application features a professional "Cinematic Studio" dark theme with:
- Cyan/teal accent colors
- Glass-morphism effects
- Smooth animations and transitions
- Responsive grid layouts

## Prerequisites

Before running VidCompare, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **FFmpeg** (bundled with the app via ffmpeg-static)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/kunaynay/vidcompare.git
cd vidcompare
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React 18 and React DOM
- Electron 29
- Tailwind CSS
- FFmpeg bindings (fluent-ffmpeg, ffmpeg-static, ffprobe-static)
- Sharp for image processing
- Zustand for state management

### Step 3: Run in Development Mode

```bash
npm run dev
```

This starts the Vite development server. The Electron app will launch automatically with hot-reload enabled.

### Step 4: Build for Production

```bash
npm run build
```

This creates:
- Compiled TypeScript files
- Bundled frontend assets
- Platform-specific installers in the `release` folder

## Usage

### Scanning for Duplicates

1. **Select Mode**: Choose between "Images" or "Videos" mode in the header
2. **Choose Folder**: Click "Select Folder" in the sidebar to pick a directory to scan
3. **Start Scan**: Click "Start Scan" to begin the duplicate detection process
4. **Review Results**: Browse the detected duplicate sets in the dashboard

### Comparing Files

1. **Click a Card**: Select any duplicate set from the dashboard to enter comparison view
2. **For Videos**: Play videos simultaneously with synchronized playback controls
3. **For Images**: Move your mouse to sync the viewport across all images. Scroll to zoom, drag to pan

### Selecting Files for Deletion

1. **Click to Select**: Click on any file in the comparison view or file list to mark it for deletion
2. **Review Selection**: The sidebar shows how many files are selected
3. **Delete**: Click "Delete" to move selected files to Trash

> **Safety Note**: VidCompare moves files to your system's Trash/Recycle Bin rather than permanently deleting them.

## Project Structure

```
vidcompare/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts           # Main entry point
│   │   └── preload.ts        # Preload script for IPC
│   └── renderer/             # React frontend
│       ├── App.tsx           # Root component
│       ├── main.tsx          # React entry point
│       ├── index.css         # Global styles & Tailwind
│       ├── types.ts          # TypeScript interfaces
│       ├── store/
│       │   └── useStore.ts   # Zustand state management
│       └── components/
│           ├── Header.tsx        # Top navigation
│           ├── Sidebar.tsx       # Left sidebar with controls
│           ├── Dashboard.tsx     # Duplicate sets grid
│           ├── DuplicateCard.tsx # Individual set card
│           ├── ComparisonView.tsx# Comparison layout
│           ├── SyncPlayer.tsx    # Synchronized video player
│           ├── ImageDiff.tsx     # Synchronized image viewer
│           ├── FileList.tsx      # File selection list
│           ├── ScanProgress.tsx  # Scan progress indicator
│           └── ErrorModal.tsx    # Error notification
├── tailwind.config.cjs       # Tailwind configuration
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Project dependencies
```

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Cross-platform desktop framework |
| **React 18** | UI component library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **FFmpeg** | Video processing and frame extraction |
| **Sharp** | High-performance image processing |

## Configuration

### Tailwind Theme

The app uses a custom "Cinematic Studio" theme. Key colors:

```javascript
// tailwind.config.cjs
colors: {
  surface: { /* Deep blacks for backgrounds */ },
  accent: { /* Cyan/teal for highlights */ },
  danger: { /* Red for warnings/deletion */ },
  success: { /* Green for confirmations */ },
  warning: { /* Amber for cautions */ }
}
```

### Build Targets

Configured in `package.json`:

- **Windows**: NSIS installer + Portable
- **macOS**: DMG
- **Linux**: AppImage

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run electron:dev` | Run Electron with Vite dev server |
| `npm run electron:build` | Build Electron app for distribution |

## Troubleshooting

### FFmpeg Not Found

If you encounter FFmpeg-related errors:

1. The app uses `ffmpeg-static` which bundles FFmpeg
2. Ensure `npm install` completed successfully
3. Try reinstalling: `npm rebuild ffmpeg-static`

### Sharp Installation Issues

On some systems, Sharp may require additional setup:

```bash
npm rebuild sharp
```

### Electron Security Warnings

Development mode may show security warnings. These are disabled in production builds.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

```
Copyright 2024

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## Acknowledgments

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [FFmpeg](https://ffmpeg.org/) - Multimedia processing
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing

---

Made with care for media organization enthusiasts.
