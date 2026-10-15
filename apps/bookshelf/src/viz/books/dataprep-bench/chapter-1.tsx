// Proving Training Data — chapter 1: Every Chunk Gets a Verdict.
//
// Grounded in data_construction_skill/SKILL.md and the released
// split_markdown_book.py, build_manifest.py, next_unprocessed_chunks.py, and
// validate_qa_jsonl.py scripts. The skill requires full chunk coverage, three
// supervision forms where supported, and exactly one kept/skipped verdict per
// chunk before completion may be claimed.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CHUNKS = [
  { title: '# Purpose', lines: 4 },
  { title: '## Rules', lines: 5 },
  { title: '## Process', lines: 4 },
  { title: '### Exceptions', lines: 3 },
  { title: '## Cases', lines: 5 },
  { title: '## Constraints', lines: 4 },
];
const FORMS = [
  { label: 'concept_qa', color: colors.ACCENT },
  { label: 'process_qa', color: colors.SECONDARY },
  { label: 'case_application', color: colors.WARM },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const docU = tl.channel('docU', 0);
  const cutU = tl.channel('cutU', 0);
  const formsU = tl.channel('formsU', 0);
  const rubricU = tl.channel('rubricU', 0);
  const statusU = tl.channel('statusU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const validateU = tl.channel('validateU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'A long source document enters the construction skill with one strict promise: every chunk will be accounted for.' });
  tl.tween(docU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 410, y: 300, k: 1.18 }, { at: 1.1, dur: 1.3, ease: ease.move });
  tl.hold(6.2, 0.5);

  tl.caption({ at: 6.7, dur: 5.5, text: 'Heading boundaries cut the document into section-aware pieces, then long paragraphs split again at a character limit.' });
  tl.tween(cutU, 1, { at: 7.2, dur: 1.5, ease: ease.draw });
  tl.hold(12.2, 0.5);

  tl.caption({ at: 12.7, dur: 5.8, text: 'Each useful piece can teach a concept, a reasoning process, or a source-grounded case. Those are three different jobs.' });
  tl.tween(formsU, 1, { at: 13.2, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 680, y: 320, k: 1.08 }, { at: 13.4, dur: 1.3, ease: ease.move });
  tl.hold(18.5, 0.5);

  tl.caption({ at: 19.0, dur: 5.5, text: 'A quality rubric rejects document trivia, unsupported leaps, and questions that only make sense beside the source.' });
  tl.tween(rubricU, 1, { at: 19.5, dur: 0.7, ease: ease.pop });
  tl.hold(24.5, 0.5);

  tl.caption({ at: 25.0, dur: 5.6, text: 'A kept chunk must write supervision records. A skipped chunk must carry a concrete reason. Silence is not a status.' });
  tl.tween(statusU, 1, { at: 25.5, dur: 1.4, ease: ease.enter });
  tl.hold(30.6, 0.5);

  tl.caption({ at: 31.1, dur: 5.4, text: 'The status ledger is append-only, so an interrupted run can discover exactly which chunks still need work.' });
  tl.tween(ledgerU, 1, { at: 31.6, dur: 1.4, ease: ease.draw });
  tl.hold(36.5, 0.5);

  tl.caption({ at: 37.0, dur: 5.7, text: 'Validation checks required fields, accepted sample types, source anchoring, and suspicious placeholder language.' });
  tl.tween(validateU, 1, { at: 37.5, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 660, y: 340, k: 1.08 }, { at: 37.7, dur: 1.3, ease: ease.move });
  tl.hold(42.7, 0.5);

  tl.caption({ at: 43.2, dur: 5.5, text: 'Then the coverage sweep crosses the whole manifest. Completion means zero unprocessed chunks and no sample without a status.' });
  tl.tween(sweepU, 1, { at: 43.8, dur: 2.8, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 46.3, dur: 1.3, ease: ease.move });
  tl.hold(48.7, 0.5);

  tl.caption({ at: 49.2, dur: 6.2, text: 'The first lesson of Data Prep Bench is blunt: a dataset is not complete until every piece of source material has a verdict.' });
  tl.tween(dimU, 1, { at: 49.7, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 50.6, dur: 0.7, ease: ease.enter });
  tl.hold(55.4, 1.0);

  return { tl, cam, docU, cutU, formsU, rubricU, statusU, ledgerU, validateU, sweepU, dimU, endU };
}

const scene = buildScene();

function ChunkCard({ i, u, statusU }: { i: number; u: number; statusU: number }) {
  const c = CHUNKS[i];
  const x = 470 + (i % 2) * 190;
  const y = 168 + Math.floor(i / 2) * 130;
  const uu = clamp01(u * 8 - i);
  const kept = i !== 3;
  return (
    <g transform={`translate(${x} ${y + (1 - uu) * 18})`} opacity={uu}>
      <rect x={-88} y={-48} width={176} height={96} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={-78} y={-25} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{c.title}</text>
      {Array.from({ length: c.lines }, (_, j) => <rect key={j} x={-78} y={-10 + j * 12} width={122 - j * 9} height={4} rx={2} fill={colors.MUTED} opacity={0.42} />)}
      {statusU > 0 && (
        <g opacity={statusU}>
          <rect x={22} y={20} width={56} height={20} rx={10} fill={kept ? colors.POSITIVE : colors.NEGATIVE} opacity={0.18} />
          <text x={50} y={34} textAnchor="middle" fill={kept ? colors.POSITIVE : colors.NEGATIVE} fontSize={12} fontWeight={700}>{kept ? 'KEPT' : 'SKIP'}</text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const cutU = s.get(scene.cutU);
  const formsU = s.get(scene.formsU);
  const sweepU = s.get(scene.sweepU);
  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={34} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>split_markdown_book.py → chunk_status.jsonl → validate_qa_jsonl.py</text>
          <text x={640} y={74} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>Full coverage is a machine, not a promise</text>

          <g opacity={s.get(scene.docU)}>
            <rect x={108} y={112} width={250} height={408} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={132} y={148} fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>source_book.md</text>
            {Array.from({ length: 24 }, (_, i) => {
              const heading = [0, 4, 9, 13, 17, 21].includes(i);
              return <rect key={i} x={132} y={174 + i * 14} width={heading ? 170 : 194 - (i % 3) * 18} height={heading ? 7 : 4} rx={2} fill={heading ? colors.TEXT : colors.MUTED} opacity={heading ? 0.82 : 0.38} />;
            })}
            {cutU > 0 && [0, 1, 2, 3, 4].map((i) => <line key={i} x1={120} x2={346} y1={230 + i * 64} y2={230 + i * 64} stroke={colors.WARM} strokeWidth={2} strokeDasharray={`${180 * cutU} 220`} />)}
          </g>

          {sweepU > 0 && (
            <g>
              <line x1={370 + 390 * sweepU} x2={370 + 390 * sweepU} y1={106} y2={480} stroke={colors.WARM} strokeWidth={3} opacity={0.8} />
              <text x={370 + 390 * sweepU} y={104} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>coverage</text>
            </g>
          )}

          {CHUNKS.map((_, i) => <ChunkCard key={i} i={i} u={cutU} statusU={s.get(scene.statusU)} />)}

          <g opacity={formsU}>
            {FORMS.map((f, i) => (
              <g key={f.label} transform={`translate(${980} ${168 + i * 130})`}>
                <rect x={-112} y={-34} width={224} height={68} rx={12} fill={colors.PANEL} stroke={f.color} strokeWidth={1.4} />
                <circle cx={-80} cy={0} r={13} fill={f.color} opacity={0.2} />
                <text x={-80} y={5} textAnchor="middle" fill={f.color} fontSize={14} fontWeight={700}>{i + 1}</text>
                <text x={-52} y={5} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{f.label}</text>
              </g>
            ))}
          </g>

          {s.get(scene.rubricU) > 0 && (
            <g opacity={s.get(scene.rubricU)} transform="translate(980 530)">
              <rect x={-118} y={-36} width={236} height={72} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={0} y={-8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={700}>QUALITY RUBRIC</text>
              <text x={0} y={15} textAnchor="middle" fill={colors.MUTED} fontSize={12}>standalone · supported · distinct</text>
            </g>
          )}

          {s.get(scene.ledgerU) > 0 && (
            <g opacity={s.get(scene.ledgerU)}>
              <rect x={382} y={500} width={464} height={44} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={396} y={527} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>chunk_status.jsonl</text>
              <text x={530} y={527} fill={colors.TEXT} opacity={0.8} fontSize={12} fontFamily={MONO}>kept · kept · kept · skipped · kept · kept</text>
            </g>
          )}

          {s.get(scene.validateU) > 0 && (
            <g opacity={s.get(scene.validateU)}>
              {['required fields', 'accepted types', 'source anchoring', 'no placeholders'].map((t, i) => (
                <g key={t} transform={`translate(1108 ${196 + i * 30})`}>
                  <path d="M0 0 l4 4 l8 -9" fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} strokeLinecap="round" />
                  <text x={18} y={4} fill={colors.TEXT} fontSize={14}>{t}</text>
                </g>
              ))}
              <g transform="translate(1190 384)">
                <circle cx={0} cy={0} r={31} fill={colors.POSITIVE} opacity={0.14} stroke={colors.POSITIVE} />
                <path d="M-16 0 l10 10 l22 -24" fill="none" stroke={colors.POSITIVE} strokeWidth={4} strokeLinecap="round" />
              </g>
            </g>
          )}

        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect width={1280} height={720} fill={colors.BG} opacity={0.7} />
          <rect x={240} y={242} width={800} height={174} rx={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={640} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={750}>Every chunk gets a verdict</text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>kept with supervision · skipped with a reason · never silently lost</text>
          <text x={640} y={385} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>unprocessed_chunks = 0</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
