// Search the Claim, Keep the Source — chapter 1: Cut Papers Into Verifiable Claims.
//
// Grounded in AskChem src/askchem/models.py (Source, Claim, Claim.generate_id),
// src/askchem/validation.py (DOI plus quote-or-locator gate),
// src/batch_extract_abstracts.py, the repository README, and arXiv:2607.28618.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TYPES = ['reaction', 'property', 'method', 'comparison'];
const CLOUD = Array.from({ length: 84 }, (_, i) => {
  const a = i * 2.399963;
  const r = 42 + Math.sqrt(i / 84) * 245;
  return { x: 640 + Math.cos(a) * r * 1.8, y: 360 + Math.sin(a) * r * 0.8 };
});

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const papersU = tl.channel('papersU', 0);
  const cutU = tl.channel('cutU', 0);
  const claimU = tl.channel('claimU', 0);
  const fieldsU = tl.channel('fieldsU', 0);
  const doiU = tl.channel('doiU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const badU = tl.channel('badU', 0);
  const gateU = tl.channel('gateU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const cloudU = tl.channel('cloudU', 0);
  const scaleU = tl.channel('scaleU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'Chemistry search usually hands you papers, even when the fact you need is one sentence buried deep inside them.' });
  tl.tween(papersU, 1, { at: 0.9, dur: 1.3, ease: ease.enter });
  tl.tween(cam, { x: 380, y: 355, k: 1.13 }, { at: 1.3, dur: 1.3, ease: ease.move });
  tl.hold(6.2, 0.6);

  tl.caption({ at: 6.8, dur: 5.8, text: 'Ask Chem changes the unit of retrieval. It cuts each source into atomic claims that can stand on their own.' });
  tl.tween(cutU, 1, { at: 7.3, dur: 1.5, ease: ease.draw });
  tl.tween(claimU, 1, { at: 8.5, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.04 }, { at: 9.0, dur: 1.3, ease: ease.move });
  tl.hold(12.6, 0.6);

  tl.caption({ at: 13.2, dur: 5.8, text: 'A claim has a type, a confidence level, a source paper, and the exact place where its evidence lives.' });
  tl.tween(fieldsU, 1, { at: 13.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 705, y: 350, k: 1.16 }, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.hold(19.0, 0.6);

  tl.caption({ at: 19.6, dur: 5.8, text: 'The source tether is not optional. Every accepted claim carries a digital object identifier back to its paper.' });
  tl.tween(doiU, 1, { at: 20.1, dur: 1.3, ease: ease.draw });
  tl.hold(25.4, 0.6);

  tl.caption({ at: 26.0, dur: 5.9, text: 'It also carries either a verbatim quote or an explicit evidence locator for a figure, table, or structured result.' });
  tl.tween(quoteU, 1, { at: 26.5, dur: 1.3, ease: ease.draw });
  tl.hold(31.9, 0.6);

  tl.caption({ at: 32.5, dur: 5.8, text: 'Remove both kinds of evidence and validation rejects the card. The finding cannot float free of its source.' });
  tl.tween(gateU, 1, { at: 32.9, dur: 0.8, ease: ease.enter });
  tl.tween(badU, 1, { at: 33.2, dur: 0.7, ease: ease.enter });
  tl.tween(bounceU, 1, { at: 34.0, dur: 1.4, ease: ease.move });
  tl.hold(38.3, 0.6);

  tl.caption({ at: 38.9, dur: 6.0, text: 'Accepted cards join a shared store of roughly two point four million claims drawn from about one hundred forty seven thousand papers.' });
  tl.tween(cam, CAMERA_HOME, { at: 39.3, dur: 1.4, ease: ease.move });
  tl.tween(cloudU, 1, { at: 39.6, dur: 2.2, ease: ease.enter });
  tl.tween(scaleU, 1, { at: 41.0, dur: 1.5, ease: ease.move });
  tl.hold(44.9, 0.6);

  tl.caption({ at: 45.5, dur: 6.3, text: 'The paper is still there. Ask Chem simply makes each finding searchable while keeping the route back to evidence intact.' });
  tl.tween(dimU, 1, { at: 46.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 46.8, dur: 0.7, ease: ease.enter });
  tl.hold(51.8, 1.0);

  return { tl, cam, papersU, cutU, claimU, fieldsU, doiU, quoteU, badU, gateU, bounceU, cloudU, scaleU, dimU, endU };
}

const scene = buildScene();

function Paper({ x, y, u, lines }: { x: number; y: number; u: number; lines: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${x} ${y + (1 - uu) * 22})`}>
    <rect width={250} height={154} rx={13} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
    <rect x={20} y={18} width={140} height={12} rx={6} fill={colors.TEXT} opacity={0.75} />
    {Array.from({ length: lines }, (_, i) => <rect key={i} x={20} y={48 + i * 17} width={190 + (i % 2) * 25} height={5} rx={3} fill={colors.MUTED} opacity={0.32} />)}
  </g>;
}

function ClaimCard({ x, y, u, color = colors.ACCENT, label = 'method' }: { x: number; y: number; u: number; color?: string; label?: string }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${x} ${y}) scale(${0.82 + 0.18 * uu})`}>
    <rect x={-145} y={-74} width={290} height={148} rx={20} fill={colors.PANEL} stroke={color} strokeWidth={2.5} />
    <rect x={-123} y={-49} width={82} height={22} rx={11} fill={color} opacity={0.2} />
    <text x={-82} y={-34} textAnchor="middle" fill={color} fontSize={12} fontFamily={MONO}>{label}</text>
    <text x={-123} y={-2} fill={colors.TEXT} fontSize={15} fontWeight={700}>source-grounded finding</text>
    <rect x={-123} y={18} width={220} height={5} rx={3} fill={colors.MUTED} opacity={0.42} />
    <rect x={-123} y={33} width={185} height={5} rx={3} fill={colors.MUTED} opacity={0.3} />
    <text x={-123} y={60} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>confidence: high</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const papersU = s.get(scene.papersU);
  const cutU = s.get(scene.cutU);
  const claimU = s.get(scene.claimU);
  const fieldsU = s.get(scene.fieldsU);
  const doiU = s.get(scene.doiU);
  const quoteU = s.get(scene.quoteU);
  const bounceU = s.get(scene.bounceU);
  const cloudU = s.get(scene.cloudU);
  const scaleU = s.get(scene.scaleU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <text x={640} y={52} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={780} opacity={mainOpacity}>Cut papers into verifiable claims</text>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity}>
        <g opacity={1 - cutU * 0.88}>
          <Paper x={95} y={168} u={papersU} lines={5} />
          <Paper x={85} y={354} u={papersU} lines={4} />
          <Paper x={355} y={262} u={papersU} lines={5} />
          <text x={220} y={550} textAnchor="middle" fill={colors.MUTED} fontSize={13}>document-shaped retrieval</text>
        </g>
        {cutU > 0 && <g opacity={cutU}>
          {TYPES.map((type, i) => <g key={type} transform={`translate(${475 + i * 92} ${164 + i * 33})`}>
            <rect x={-48} y={-18} width={96} height={36} rx={10} fill={colors.PANEL} stroke={[colors.ACCENT, colors.WARM, colors.POSITIVE, colors.SECONDARY][i]} />
            <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{type}</text>
          </g>)}
          <path d="M335 336 C420 336 430 260 492 260" fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="8 8" strokeDashoffset={(1 - cutU) * 80} />
        </g>}
        <ClaimCard x={760} y={342} u={claimU} />
        {fieldsU > 0 && <g opacity={fieldsU} fontFamily={MONO} fontSize={11}>
          <text x={960} y={264} fill={colors.ACCENT}>claim_type</text>
          <text x={960} y={294} fill={colors.WARM}>source_doi</text>
          <text x={960} y={324} fill={colors.POSITIVE}>verbatim_quote</text>
          <text x={960} y={354} fill={colors.SECONDARY}>confidence</text>
        </g>}
        {doiU > 0 && <g opacity={doiU}>
          <path d="M760 416 C760 470 890 468 890 520" fill="none" stroke={colors.WARM} strokeWidth={3} />
          <rect x={732} y={512} width={316} height={46} rx={14} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={890} y={541} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>source_doi: 10.xxxx/...</text>
        </g>}
        {quoteU > 0 && <g opacity={quoteU}>
          <path d="M615 340 C545 340 535 458 468 458" fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
          <rect x={294} y={430} width={300} height={66} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={444} y={457} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>verbatim_quote</text>
          <rect x={325} y={473} width={238} height={5} rx={3} fill={colors.TEXT} opacity={0.5} />
        </g>}
        {s.get(scene.gateU) > 0 && <g opacity={s.get(scene.gateU)}>
          <rect x={1000} y={205} width={128} height={280} rx={22} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={3} />
          <text x={1064} y={244} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>validate_claim</text>
          <path d="M1024 354 l24 24 52 -70" fill="none" stroke={colors.POSITIVE} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>}
        {s.get(scene.badU) > 0 && <g transform={`translate(${800 + bounceU * 155} ${165 - Math.sin(bounceU * Math.PI) * 62})`} opacity={s.get(scene.badU) * (1 - 0.45 * bounceU)}>
          <rect x={-86} y={-30} width={172} height={60} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
          <text y={-3} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>no quote</text>
          <text y={16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>no locator</text>
        </g>}
        {cloudU > 0 && <g opacity={cloudU}>
          {CLOUD.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5 + (i % 4)} fill={i % 7 === 0 ? colors.WARM : colors.ACCENT} opacity={0.18 + 0.55 * clamp01(cloudU * 8 - i / 12)} />)}
          <g transform={`translate(${760 - scaleU * 120} ${342 + scaleU * 18}) scale(${1 - scaleU * 0.38})`}><ClaimCard x={0} y={0} u={1} /></g>
          <text x={640} y={590} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={760}>2.4M claims · 147K papers</text>
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={180} y={226} width={920} height={220} rx={28} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} />
      <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={35} fontWeight={820}>The unit is the claim</text>
      <text x={640} y={352} textAnchor="middle" fill={colors.ACCENT} fontSize={22}>typed · source-grounded · independently retrievable</text>
      <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={14}>the paper remains one bright tether away</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
