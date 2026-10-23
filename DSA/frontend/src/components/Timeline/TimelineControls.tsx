import React from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
} from 'lucide-react';

interface TimelineControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSeek: (stepIndex: number) => void;
  onChangeSpeed: (speed: number) => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  onSeek,
  onChangeSpeed,
}) => {
  const hasSteps = totalSteps > 0;
  const isAtStart = currentStepIndex <= 0;
  const isAtEnd = currentStepIndex >= totalSteps - 1;

  return (
    <div className="timeline-container">
      <div className="timeline-playback-bar">
        {/* Playback action buttons */}
        <div className="playback-actions">
          <button
            onClick={onJumpToStart}
            disabled={!hasSteps || isAtStart}
            className="btn-playback"
            title="Jump to Start (Home)"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={onStepBackward}
            disabled={!hasSteps || isAtStart}
            className="btn-playback"
            title="Step Backward (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={onPlayPause}
            disabled={!hasSteps}
            className={`btn-play-pause ${isPlaying ? 'playing' : ''}`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
          </button>

          <button
            onClick={onStepForward}
            disabled={!hasSteps || isAtEnd}
            className="btn-playback"
            title="Step Forward (Right Arrow)"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={onJumpToEnd}
            disabled={!hasSteps || isAtEnd}
            className="btn-playback"
            title="Jump to End (End)"
          >
            <ChevronsRight size={16} />
          </button>
        </div>

        {/* Step Scrubber / Progress slider */}
        <div className="timeline-scrubber-wrapper">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={(e) => onSeek(Number(e.target.value))}
            disabled={!hasSteps}
            className="timeline-slider"
          />
          <div className="timeline-progress-labels">
            <span className="step-count-label">
              {hasSteps
                ? `Step ${currentStepIndex + 1} of ${totalSteps}`
                : 'No execution trace'}
            </span>
            <span className="playback-hint">
              Use Space to Play/Pause, ← / → to Step
            </span>
          </div>
        </div>

        {/* Playback speed selector */}
        <div className="playback-speed-group">
          <Gauge size={14} className="text-zinc-400" />
          <select
            value={playbackSpeed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="speed-select"
            disabled={!hasSteps}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
            <option value={4}>4.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
};
