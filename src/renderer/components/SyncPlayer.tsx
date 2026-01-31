import { useRef, useState, useEffect, useCallback } from 'react';
import type { FileInfo } from '../types';
import { useStore } from '../store/useStore';

// Convert Windows path to file:// URL
const toFileUrl = (path: string): string => {
  // Replace backslashes with forward slashes and encode special characters
  const normalizedPath = path.replace(/\\/g, '/');
  return `file:///${normalizedPath}`;
};

interface SyncPlayerProps {
  videos: FileInfo[];
}

export default function SyncPlayer({ videos }: SyncPlayerProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [maxDuration, setMaxDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDurations, setVideoDurations] = useState<number[]>([]);
  const { selectedForDeletion, toggleFileForDeletion } = useStore();

  // Track which videos have ended
  const endedVideos = useRef<Set<number>>(new Set());

  // Initialize durations when videos are loaded
  const handleLoadedMetadata = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      setVideoDurations(prev => {
        const newDurations = [...prev];
        newDurations[index] = video.duration;
        return newDurations;
      });
    }
  }, []);

  // Update max duration when durations change
  useEffect(() => {
    if (videoDurations.length > 0 && videoDurations.every(d => d > 0)) {
      setMaxDuration(Math.max(...videoDurations));
    }
  }, [videoDurations]);

  // Handle video ending - Sync-Loop Logic
  const handleEnded = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video || maxDuration === 0) return;

    const isLongest = Math.abs(video.duration - maxDuration) < 0.1;

    if (!isLongest) {
      // Short video ended: Pause and wait
      video.pause();
      endedVideos.current.add(index);
    } else {
      // Longest video ended: Reset ALL and Play
      endedVideos.current.clear();
      videoRefs.current.forEach(v => {
        if (v) {
          v.currentTime = 0;
          if (isPlaying) {
            v.play().catch(console.error);
          }
        }
      });
    }
  }, [maxDuration, isPlaying]);

  // Play all videos
  const playAll = useCallback(() => {
    endedVideos.current.clear();
    videoRefs.current.forEach(video => {
      if (video) {
        video.play().catch(console.error);
      }
    });
    setIsPlaying(true);
  }, []);

  // Pause all videos
  const pauseAll = useCallback(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.pause();
      }
    });
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseAll();
    } else {
      playAll();
    }
  }, [isPlaying, playAll, pauseAll]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = newMuted;
      }
    });
    setIsMuted(newMuted);
  }, [isMuted]);

  // Seek all videos
  const seekAll = useCallback((time: number) => {
    endedVideos.current.clear();
    videoRefs.current.forEach((video, index) => {
      if (video) {
        // Only seek if within video's duration
        const videoDuration = videoDurations[index] || video.duration;
        video.currentTime = Math.min(time, videoDuration);
      }
    });
    setCurrentTime(time);
  }, [videoDurations]);

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const longestVideo = videoRefs.current.find(v =>
        v && Math.abs(v.duration - maxDuration) < 0.1
      );
      if (longestVideo) {
        setCurrentTime(longestVideo.currentTime);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [maxDuration]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Determine grid layout based on video count
  const getGridClass = () => {
    switch (videos.length) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-3';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Video Grid */}
      <div className={`flex-1 grid ${getGridClass()} gap-6 overflow-hidden p-1`}>
        {videos.map((video, index) => {
          const isSelected = selectedForDeletion.has(video.id);
          return (
            <div
              key={video.id}
              onClick={() => toggleFileForDeletion(video.id)}
              className={`relative bg-black rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group
                         ${isSelected ? 'selected-glow' : 'ring-1 ring-surface-700/50 hover:ring-accent-500/30'}`}
            >
              <video
                ref={el => { videoRefs.current[index] = el; }}
                src={toFileUrl(video.path)}
                muted={isMuted}
                playsInline
                onLoadedMetadata={() => handleLoadedMetadata(index)}
                onEnded={() => handleEnded(index)}
                className="w-full h-full object-contain"
              />

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-accent-500 rounded-lg
                                flex items-center justify-center shadow-glow z-10 animate-fade-in">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 media-overlay p-4">
                <div className="text-white text-sm font-medium truncate mb-1">
                  {video.fileName}
                </div>
                <div className="flex gap-3 text-xs text-surface-300 font-mono">
                  <span>{formatBytes(video.size)}</span>
                  {video.width && video.height && (
                    <span>{video.width}x{video.height}</span>
                  )}
                  {video.duration && (
                    <span>{formatTime(video.duration)}</span>
                  )}
                </div>
              </div>

              {/* Index Badge */}
              <div className="absolute top-3 left-3 w-7 h-7 bg-accent-600 rounded-lg
                              flex items-center justify-center text-white text-xs font-bold shadow-glow">
                {index + 1}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 glass-panel rounded-xl p-5">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-5">
          <span className="text-sm text-surface-400 w-12 font-mono">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative group">
            <input
              type="range"
              min={0}
              max={maxDuration || 100}
              value={currentTime}
              onChange={(e) => seekAll(parseFloat(e.target.value))}
              className="w-full"
            />
            {/* Progress fill */}
            <div
              className="absolute top-1/2 left-0 h-1.5 bg-accent-500 rounded-full pointer-events-none -translate-y-1/2 progress-glow"
              style={{ width: `${maxDuration ? (currentTime / maxDuration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-surface-400 w-12 font-mono">
            {formatTime(maxDuration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-14 h-14 bg-accent-600 hover:bg-accent-500 rounded-full
                       flex items-center justify-center transition-all duration-200 shadow-glow hover:shadow-glow-lg"
          >
            {isPlaying ? (
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="btn-icon"
          >
            {isMuted ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </button>
        </div>

        {/* Sync Info */}
        <div className="mt-4 text-center text-xs text-surface-500">
          <span className="inline-flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Videos sync at the end of the longest video ({formatTime(maxDuration)})
          </span>
        </div>
      </div>
    </div>
  );
}
