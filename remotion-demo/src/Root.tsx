import { Composition } from 'remotion';
import { DataFlow, TOTAL_FRAMES } from './DataFlow';

// One composition, ~20s, 1080p30. Duration is derived from the story's steps,
// exactly like the D3 engine derives slide durations.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DataFlow"
      component={DataFlow}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
