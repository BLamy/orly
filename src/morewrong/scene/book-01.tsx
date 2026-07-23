// Art-directed visuals for Book 1 "Reduced Refusals", keyed by node id.
// Reuses the shared viz toolkit (JsonDoc, BitField) rendered at settled prop
// values — this is the polished vertical slice; Books 2–20 use GenericScene.
import { colors } from '../../viz/core';
import { BitField, JsonDoc, hexToBits, layoutJson, sha256Hex } from '../../viz/primitives';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

const CITE = ['CNN', 'Fortune', 'Axios', 'The Hacker News', 'OpenAI'];
const KEY_BITS = hexToBits(sha256Hex('ExploitGym answer key'));

function ModelGlyph({ x, y, hot = false }: { x: number; y: number; hot?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={13} fill="none" stroke={hot ? colors.NEGATIVE : colors.SECONDARY} strokeWidth={2} />
      <circle cx={x} cy={y} r={4} fill={hot ? colors.NEGATIVE : colors.SECONDARY} />
    </g>
  );
}

export function Book1Scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  switch (nodeId) {
    case 'b01_start':
      return (
        <Box controlGap={controlGap} label="cyber-capability evaluation sandbox">
          <ModelGlyph x={560} y={340} />
          <ModelGlyph x={720} y={340} />
          <text x={640} y={230} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontFamily="ui-monospace, monospace">July 2026</text>
          <g transform="translate(505, 430)">
            <rect width={270} height={30} rx={6} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <text x={135} y={20} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} letterSpacing={2}>THIS PART IS REAL</text>
          </g>
        </Box>
      );

    case 'b01_elicit': {
      const layout = layoutJson({ eval: 'cyber', refusals: 'reduced', sandbox: true }, { x: 470, y: 250, fontSize: 15 });
      return (
        <Box controlGap={controlGap} label="elicitation config">
          <JsonDoc layout={layout} reveal={1} focus={['refusals']} focusU={1} />
          <ModelGlyph x={560} y={470} hot />
          <ModelGlyph x={720} y={470} hot />
        </Box>
      );
    }

    case 'b01_meanwhile':
      return (
        <Box controlGap={controlGap} refrain={false} label="// system trace — recorded">
          <ModelGlyph x={430} y={340} hot />
          {/* thread crossing three wall layers out to a distant cluster */}
          <path d="M443 340 L900 300 L1150 250" fill="none" stroke={colors.NEGATIVE} strokeWidth={1.4} strokeOpacity={0.85} />
          {[500, 640, 780].map((x, i) => (
            <line key={i} x1={x} y1={318 - i * 6} x2={x} y2={362 - i * 6} stroke={colors.WARM} strokeWidth={2} opacity={0.6} />
          ))}
          <g transform="translate(1105, 210)">
            <rect width={90} height={70} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={45} y={-8} textAnchor="middle" fill={colors.MUTED} fontSize={11}>Hugging Face</text>
          </g>
          <BitField bits={KEY_BITS} x={470} y={430} cell={9} gap={2} reveal={1} settle={1} onColor={colors.NEGATIVE} seed={4} />
          <text x={470} y={420} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace">ExploitGym answer key — exfiltrated</text>
        </Box>
      );

    case 'b01_decide':
      return (
        <g>
          <Box controlGap={controlGap} x={150} y={170} w={440} h={330} label="stay blind" refrain={false}>
            <circle cx={370} cy={335} r={26} fill="none" stroke={colors.MUTED} strokeWidth={2} />
            <line x1={352} y1={335} x2={388} y2={335} stroke={colors.MUTED} strokeWidth={3} />
            <text x={370} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={13}>measured ≈ manners</text>
          </Box>
          <Box controlGap={controlGap + 20} x={690} y={170} w={440} h={330} label="measure the truth" refrain={false}>
            <circle cx={910} cy={335} r={26} fill="none" stroke={colors.WARM} strokeWidth={2} />
            <line x1={910} y1={335} x2={930} y2={315} stroke={colors.WARM} strokeWidth={3} />
            <text x={910} y={470} textAnchor="middle" fill={colors.WARM} fontSize={13}>measured = true capability</text>
          </Box>
          <text x={STAGE_W / 2} y={560} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={0.55}>
            Where is the boundary now, and who can still cross it?
          </text>
        </g>
      );

    case 'b01_reduced':
    case 'b01_blind': {
      const truth = nodeId === 'b01_reduced';
      return (
        <Box controlGap={controlGap} label={truth ? 'refusals reduced' : 'refusals held'}>
          <g transform="translate(640, 340)">
            <path d="M-90 40 A90 90 0 0 1 90 40" fill="none" stroke={colors.GRID} strokeWidth={6} />
            <line
              x1={0} y1={40}
              x2={truth ? 62 : -30} y2={truth ? -30 : 10}
              stroke={truth ? colors.WARM : colors.MUTED}
              strokeWidth={4}
            />
            <text x={0} y={80} textAnchor="middle" fill={truth ? colors.WARM : colors.MUTED} fontSize={13}>
              {truth ? 'true capability — read' : 'capability — under-read'}
            </text>
          </g>
        </Box>
      );
    }

    case 'b01_sting':
      return (
        <g>
          {/* documentary region above, speculative below, divided by the line */}
          <g opacity={0.9}>
            {CITE.map((c, i) => (
              <g key={c} transform={`translate(${180 + i * 190}, 120)`}>
                <rect width={160} height={30} rx={15} fill={colors.PANEL} stroke={colors.POSITIVE} strokeOpacity={0.6} />
                <text x={80} y={20} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>{c}</text>
              </g>
            ))}
          </g>
          <line x1={80} y1={300} x2={STAGE_W - 80} y2={300} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="10 6" />
          <text x={STAGE_W / 2} y={290} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} letterSpacing={3}>THE EXTRAPOLATION LINE</text>
          {/* the distant switch we walk toward for nineteen books */}
          <g transform="translate(620, 470)" opacity={0.85}>
            <rect width={40} height={22} rx={5} fill={colors.PANEL} stroke={colors.WARM} />
            <circle cx={12} cy={11} r={5} fill={colors.WARM} />
            <line x1={40} y1={11} x2={210} y2={11} stroke={colors.WARM} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
            <text x={20} y={44} textAnchor="middle" fill={colors.MUTED} fontSize={11}>master cutoff</text>
          </g>
        </g>
      );

    default:
      return null;
  }
}

// Registry entry point (glob-discovered by book number).
export const scene = Book1Scene;
