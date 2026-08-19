import type { ReactNode } from 'react';
import {
  Player,
  type PlayerAudio,
  type SceneState,
  type Timeline,
} from './engine/core';

export type { PlayerAudio, SceneState, Timeline };

export interface VideoScene {
  timeline: Timeline;
  render: (state: SceneState) => ReactNode;
}

export interface VizPlayerProps {
  scene: VideoScene;
  audio?: PlayerAudio;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  showCaptions?: boolean;
  className?: string;
}

/**
 * React-18-compatible runtime adapter for Docstream's VizEmbed component.
 * Docstream supplies the document/figure semantics; this keeps the actual
 * viewer on the bookshelf's existing deterministic viz engine and avoids
 * pulling the optional React-19-only package runtime into the app.
 */
export function VizPlayer({
  scene,
  audio,
  width,
  height,
  loop = false,
  autoplay = false,
  showCaptions = true,
  className,
}: VizPlayerProps) {
  return (
    <div className={className} data-viz-player="">
      <Player
        timeline={scene.timeline as Timeline}
        width={width}
        height={height}
        loop={loop}
        autoplay={autoplay}
        showCaptions={showCaptions}
        audio={audio}
      >
        {scene.render}
      </Player>
    </div>
  );
}

export function createVideoScene(timeline: Timeline, render: VideoScene['render']): VideoScene {
  return { timeline, render };
}
