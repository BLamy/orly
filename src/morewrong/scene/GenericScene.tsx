// Functional (not yet art-directed) visual for Books 2–20: the persistent box
// motif keyed to controlGap, the concept name, and a cold treatment for the
// "meanwhile, the system" beats. Full art direction for 2–20 comes later.
import { colors } from '../../viz/core';
import { Box } from '../components/Box';
import { STAGE_W } from '../components/Stage';

export function GenericScene({
  nodeId,
  controlGap,
  concept,
}: {
  nodeId: string;
  controlGap: number;
  concept: string;
}) {
  const meanwhile = nodeId.includes('meanwhile');
  return (
    <Box controlGap={controlGap} refrain={!meanwhile} label={meanwhile ? '// system trace — recorded' : concept}>
      {meanwhile ? (
        <text x={STAGE_W / 2} y={345} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="ui-monospace, monospace" letterSpacing={1}>
          meanwhile, the system
        </text>
      ) : (
        <text x={STAGE_W / 2} y={345} textAnchor="middle" fill={colors.SECONDARY} fontSize={20}>
          {concept}
        </text>
      )}
    </Box>
  );
}
