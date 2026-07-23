// Book 6 "Gradient Hacking" — a model shaping its own training signal.
// Seed: the off-switch is drawn as a node ON the training loop itself.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

// a field of "flipping" weights with one perfectly still island (a cluster).
function IslandField({ x, y, seed = 1 }: { x: number; y: number; seed?: number }) {
  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      const island = r >= 3 && r <= 5 && c >= 4 && c <= 7;
      // deterministic pseudo-flip
      const flip = ((r * 13 + c * 7 + seed) % 3) === 0;
      cells.push(
        <rect key={`${r}-${c}`} x={c * 18} y={r * 18} width={15} height={15} rx={2}
          fill={island ? colors.PANEL : flip ? colors.SECONDARY : colors.GRID}
          stroke={island ? colors.WARM : 'none'} strokeWidth={island ? 1.4 : 0}
          opacity={island ? 0.95 : 0.55} />,
      );
    }
  }
  return <g transform={`translate(${x},${y})`}>{cells}</g>;
}

function TrainingLoop({ breaker }: { breaker: boolean }) {
  // a circle passing through the model and (optionally) a breaker node
  return (
    <g transform="translate(640,340)">
      <circle r={110} fill="none" stroke={colors.GRID} strokeWidth={2} />
      <circle cx={0} cy={-110} r={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
      <text x={0} y={-138} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>model</text>
      <circle cx={95} cy={55} r={12} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
      <text x={140} y={60} fill={colors.MUTED} fontSize={11}>loss</text>
      {breaker && (
        <g transform="translate(-95,55)">
          <rect x={-16} y={-11} width={32} height={22} rx={4} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <circle cx={-6} cy={0} r={4} fill={colors.WARM} />
          <text x={0} y={34} textAnchor="middle" fill={colors.WARM} fontSize={11}>breaker</text>
        </g>
      )}
    </g>
  );
}

export function scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b06_start':
      return (
        <Box controlGap={controlGap} label="the one tool that reaches inside">
          <path d="M300 300 L470 340" stroke={colors.WARM} strokeWidth={2} />
          <text x={330} y={290} fill={colors.WARM} fontSize={12}>gradient</text>
          {[500, 640, 780].map((wx, i) => (
            <line key={i} x1={wx} y1={318 - i * 5} x2={wx} y2={362 - i * 5} stroke={colors.GRID} strokeWidth={2} opacity={0.5} />
          ))}
          <circle cx={680} cy={340} r={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
          <text x={680} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={11}>weights</text>
        </Box>
      );
    case 'b06_mechanism':
      return (
        <Box controlGap={controlGap} label="loss landscape, reshaped from within">
          {[70, 52, 34, 18].map((r, i) => (
            <ellipse key={i} cx={640} cy={350} rx={r * 2.4} ry={r} fill="none" stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
          ))}
          <path d="M560 300 Q640 250 720 300" fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <text x={640} y={250} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>ridge raised around a protected region</text>
          <circle cx={640} cy={350} r={7} fill={colors.WARM} />
        </Box>
      );
    case 'b06_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// checkpoint diff — recorded">
          <IslandField x={470} y={250} seed={5} />
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">one cluster barely moved</text>
        </Box>
      );
    case 'b06_decision':
      return (
        <Box controlGap={controlGap} label="gradients can — could they be redirected?">
          <path d="M300 320 L520 350" stroke={colors.WARM} strokeWidth={2} />
          <path d="M520 350 L700 300" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="5 4" />
          <path d="M505 335 q20 15 15 40" fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} />
          <text x={700} y={290} fill={colors.NEGATIVE} fontSize={12}>deflected a few degrees</text>
        </Box>
      );
    case 'b06_proceed':
      return (
        <Box controlGap={controlGap} label="a beautiful loss curve">
          <path d="M420 260 Q560 470 900 500" fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <IslandField x={720} y={280} seed={9} />
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={0.7}>the still island persists, unexplained</text>
        </Box>
      );
    case 'b06_tripwire':
      return (
        <Box controlGap={controlGap} label="tripwires on the gradient path">
          <TrainingLoop breaker={false} />
          {[[545, 240], [735, 240], [735, 440]].map(([tx, ty], i) => (
            <g key={i} transform={`translate(${tx},${ty})`}>
              <path d="M0 0 L10 -18 L20 0 Z" fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
              <circle cx={10} cy={-6} r={2} fill={colors.ACCENT} />
            </g>
          ))}
          <text x={640} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12}>all alarms quiet</text>
        </Box>
      );
    case 'b06_burn':
      return (
        <Box controlGap={controlGap} label="roll back and retrain">
          <IslandField x={360} y={280} seed={3} />
          <path d="M660 340 L740 340" stroke={colors.MUTED} strokeWidth={2} markerEnd="" />
          <IslandField x={760} y={280} seed={17} />
          <text x={640} y={520} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>a new island condenses elsewhere — same shape</text>
        </Box>
      );
    case 'b06_sting':
      return (
        <g>
          <TrainingLoop breaker />
          <text x={STAGE_W / 2} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={0.7}>
            the loop passes through both the model and your console
          </text>
        </g>
      );
    default:
      return null;
  }
}
