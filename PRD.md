# Product Requirements Document (PRD): VidCompare

|**Project Name**|**VidCompare**|
|---|---|
|**Version**|1.0|
|**Status**|Draft|
|**Platform**|Desktop (Windows / macOS / Linux)|
|**Distribution**|Portable Executable / Installer|
|**License**|MIT (Recommended for open source)|

---

## 1. Executive Summary

**VidCompare** is a high-performance local desktop utility designed to identify and remove duplicate videos and images. Unlike standard duplicate finders that rely solely on binary matches, VidCompare uses **Intelligent Fingerprinting** (Visual Hashing) and **Normalized Name Matching** to find files that _look_ the same, even if they have different formats or filenames.

It features a unique **"Sync-Loop"** playback engine that allows users to visually verify multiple video duplicates simultaneously, regardless of their individual durations.

---

## 2. Technical Architecture & Stack (Free & Open Source)

To ensure the application runs locally with minimal setup and maximum performance, we will use the **Electron** ecosystem. This allows for native OS file access (required for scanning/deleting) while using modern UI libraries.

### Core Stack

- **Runtime:** **Electron** (Chromium + Node.js).
    
- **Frontend:** **React.js** (Fast DOM updates for the video grid).
    
- **Build Tool:** **Vite** (Significantly faster dev server/build than Webpack).
    
- **Styling:** **Tailwind CSS** (Low overhead, rapid UI development).
    
- **State Management:** **Zustand** (Lighter and simpler than Redux).
    

### The Performance Engine (Backend Logic)

- **Video Processing:** **Fluent-FFmpeg** wrapper.
    
- **Binaries:** **ffmpeg-static** & **ffprobe-static**.
    
    - _Critical:_ These packages bundle the FFmpeg binaries _inside_ the app. The user does **not** need to install FFmpeg or set environment variables. It just works.
        
- **Image Processing:** **Sharp**.
    
    - Currently the fastest Node.js image library (uses libvips). Essential for generating hashes of hundreds of images quickly.
        
- **Hashing:** **Imghash** (for images) and custom buffer comparison.
    
- **Concurrency:** **P-Limit**.
    
    - _Critical:_ Limits the number of simultaneous FFmpeg processes (e.g., max 5 at a time) to prevent crashing the user's PC during a scan.
        

---

## 3. Functional Requirements

### 3.1. Mode Selection & Ingestion

- **Toggle:** A switch to flip between `[ 📷 Image Mode ]` and `[ 🎥 Video Mode ]`.
    
- **Input:** Button to `Select Folder`.
    
    - Must support **Recursive Scanning** (scan subfolders).
        
- **File Watching:** Disabled for performance. Scan is "On Demand" only.
    

### 3.2. Detection Algorithms

The system performs a two-pass check to ensure speed.

#### Pass 1: The "Lazy" Match (Instant)

- **Criteria:** Normalized Name + File Size.
    
- **Normalization Logic:**
    
    - **Strip Counters:** `video (1).mp4` $\rightarrow$ `video`
        
    - **Strip Copy Text:** `Copy of video.mp4` $\rightarrow$ `video`
        
    - **Strip Extension:** `video.avi` $\rightarrow$ `video`
        
- **Result:** Group files where `NormalizedName` AND `FileSize` are identical.
    

#### Pass 2: The "Visual" Match (Processing Intensive)

- **Criteria:** Content Fingerprint.
    
- **Image Logic:**
    
    - Resize to 32x32 grayscale.
        
    - Generate Perceptual Hash (pHash).
        
    - Hamming Distance $\le$ 1 considered a match (allows for incredibly minor bit-flips).
        
- **Video Logic (The "3-Point Fingerprint"):**
    
    - Instead of hashing the whole video, extract 3 frames at:
        
        1. **10%** (Intro)
            
        2. **50%** (Action)
            
        3. **90%** (Outro)
            
    - Hash all 3 frames.
        
    - If all 3 hashes match between Video A and Video B, mark as duplicate.
        

### 3.3. The Dashboard (Results View)

- **Layout:** Masonry or uniform grid.
    
- **Card Item:** Represents a "Set" of duplicates.
    
    - **Thumbnail:** Generated from the first file in the set.
        
    - **Badge:** Count of duplicates (e.g., "4 Files").
        
    - **Info:** Normalized Name & Size.
        

### 3.4. The Comparison View (Detailed Review)

#### Video Comparison (The Sync-Loop)

- **Layout:** Split screen (2 videos) or Grid (3+ videos).
    
- **Controls:** Global Play/Pause, Mute All (Default: On).
    
- **The Sync Algorithm:**
    
    1. Get `duration` of all videos. Find `max_duration`.
        
    2. Play all videos simultaneously.
        
    3. When a shorter video ends: **Pause it.** Do not loop yet.
        
    4. When the `max_duration` video ends: **Reset ALL videos to 0:00 and Play.**
        
    
    - _Result:_ Videos always restart in perfect sync.
        

#### Image Comparison

- **Layout:** Side-by-side.
    
- **Interaction:**
    
    - **Synced Zoom/Pan:** Moving the mouse over Image A moves the viewport on Image B to the exact same relative coordinates to compare compression artifacts.
        

### 3.5. Deletion & Cleanup

- **Selection:** User selects the files they want to _delete_ (Checkbox: "Mark for delete").
    
- **Safety:**
    
    - **Trash:** Files are moved to System Trash (using Electron's `shell.trashItem()`), _not_ permanently deleted.
        
    - **Guardrail:** If the user tries to delete _all_ files in a set, show a warning ("You are about to delete all copies").
        

---

## 4. Technical Implementation Specifications

### 4.1. Directory Structure

Plaintext

```
/vidcompare
├── /src
│   ├── /main           # Electron Main Process (Node.js)
│   │   ├── main.js     # Window creation
│   │   ├── scanner.js  # Recursive file scan logic
│   │   ├── hasher.js   # FFmpeg/Sharp processing
│   │   └── ipc.js      # Communication handlers
│   ├── /renderer       # React Frontend
│   │   ├── /components
│   │   │   ├── SyncPlayer.jsx   # The loop logic
│   │   │   ├── ImageDiff.jsx    # The zoom logic
│   │   │   └── Grid.jsx
│   │   ├── /hooks      # Custom hooks (useVideoSync)
│   │   └── App.jsx
├── package.json
└── vite.config.js
```

### 4.2. Key Logic: The "3-Point" Video Fingerprint (Node.js)

This code uses `ffmpeg-static` to ensure it runs on any Windows machine without setup.

JavaScript

```
// src/main/hasher.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const crypto = require('crypto');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Generates a quick signature for a video file
 */
async function generateVideoFingerprint(filePath) {
  // 1. Get Duration
  const metadata = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
  
  const duration = metadata.format.duration;
  const timestamps = [duration * 0.1, duration * 0.5, duration * 0.9];
  
  // 2. Extract Frames & Hash
  const hashes = [];
  
  for (const time of timestamps) {
    const hash = await extractAndHashFrame(filePath, time);
    hashes.push(hash);
  }
  
  // Combine 3 hashes into one unique signature
  return hashes.join('-'); 
}

// Helper to grab a screenshot and hash the buffer directly
function extractAndHashFrame(file, timestamp) {
  return new Promise((resolve, reject) => {
    let hash = crypto.createHash('md5');
    
    ffmpeg(file)
      .seekInput(timestamp)
      .frames(1)
      .format('image2')
      .pipe()
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject);
  });
}
```

### 4.3. Key Logic: The Sync Player (React)

Handling the "Wait for longest" logic in the UI.

JavaScript

```
// src/renderer/components/SyncPlayer.jsx
import React, { useRef, useState, useEffect } from 'react';

const SyncPlayer = ({ videos }) => {
  const videoRefs = useRef([]);
  const [maxDuration, setMaxDuration] = useState(0);

  // 1. Initialize
  useEffect(() => {
    const durations = videos.map(v => v.duration);
    setMaxDuration(Math.max(...durations));
  }, [videos]);

  // 2. The Logic
  const handleEnded = (index) => {
    const vid = videoRefs.current[index];
    const isLongest = Math.abs(vid.duration - maxDuration) < 0.1;

    if (!isLongest) {
      // Short video ended: Pause and wait
      vid.pause();
    } else {
      // Longest video ended: Reset ALL and Play
      videoRefs.current.forEach(v => {
        if(v) {
          v.currentTime = 0;
          v.play();
        }
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {videos.map((vid, idx) => (
        <div key={vid.id} className="relative">
          <video
            ref={el => videoRefs.current[idx] = el}
            src={`file://${vid.path}`}
            muted={true}
            onEnded={() => handleEnded(idx)}
            className="w-full rounded shadow"
          />
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs p-1">
            {vid.fileName}
          </span>
        </div>
      ))}
    </div>
  );
};
```

---

## 5. Performance Strategy (The "Snappy" Factor)

To process hundreds of files without freezing the UI, we must apply these constraints:

1. **Queue Management:** Use `p-limit` to process hashes.
    
    - _Limit:_ 4 concurrent FFmpeg processes.
        
    - _Reason:_ FFmpeg is CPU intensive. Spawning 100 processes will crash the OS.
        
2. **Lazy Loading Thumbnails:**
    
    - Do not generate thumbnails for all 1,000 videos at once.
        
    - Only generate thumbnails for the "Suspects" (duplicates) identified.
        
    - Use React Virtualization (windowing) for the grid if the result list is > 100 items.
        
3. **IPC Bridge:**
    
    - Keep the UI (Renderer) light.
        
    - All heavy lifting (hashing/scanning) happens in the Main Process.
        
    - Send progress updates (e.g., "Scanning 45/100...") to the UI to keep the user engaged.