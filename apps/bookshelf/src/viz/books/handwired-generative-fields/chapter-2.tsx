// Scored, Searched, Climbed
//
// Generative Fields — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT),
// lab/generative-fields (paths below are relative to it unless they start with src/).
//   flow-layout.ts:43-49 (violationSlackPixels = 0.5), 361-391 (containment: bottom limit viewportHeight − paddingY,
//     right limit paddingX + innerWidth + innerWidth·wrapSlack), 426-440 (validBit, violationDepth)
//   README.md:35-37 (120 overlap pairs; the flow cannot express horizontal overlap; 0 / 2,886 / 44), 80 (173 vs 120 on
//     the hero importance probe), 117-127 (adversarial key triple within 2^-36; fitness under-specification)
//   fields.ts:102-108 (defaultContext: 1280 × 800, wrapSlack 0.004, minimum 48 × 32 px)
//   search.ts:18-56 (createRandom, sampleFieldVector), 82-125 (runSearch); experiments.ts:26-33 (searchConfig,
//     ascentConfig), 147-187 (the printed search and gradient sections)
//   fitness.ts:22-37 (weights; richSlotCount 10), 190 (contentRichness = min(1, visibleCount / 10)), 358-364
//     (selectionScore: invalid → −1 − min(1, depth / 1000))
//   optimize.ts:148-190 (ascendFitness; loss = −fitness + 0.002·violationDepth); ste-backprop.ts:3-10
//   generation.test.ts:12-35 (1078, 0, 2886, 44; top fitness in (0.87, 0.88)), 37-76 (12 starts end valid; July
//     scores are not pinned), 78-105 (without content richness, two visible slabs score 1)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every dot and trail is REAL: the data block below was dumped from the pinned lab code by
// .orly-work/hw-books/handwired-generative-fields/ch2/dump.ts (bun): per sample of the 4,000-sample search, its
// verdict (v valid · c containment · s minimum size · b both) and, for valid ones, its fitness to 3 dp; for each of
// the 12 seeded climbs, the best selection score after k = 0..150 steps (ascendFitness replayed with steps = k;
// '000' = still invalid); and the slot geometry of search sample 4, search sample 7, the search winner (1731), the
// best climb and the test's hand-built two-slab layout. The module re-derives the test's counts and the printed
// statistics from that block and throws if any disagree. The step plot of a decision bit is schematic (labelled).
// Changes from the plan: the score axis runs 0.25-1.0, not 0.6-1.0 (221 valid samples score below 0.6, the lowest
// 0.297); the dot field is 80 × 50, not 40 × 100; per the fact-check, "old weights: 1.000" reads "without richness
// term: 1.000", and the search time reads "≈ ¼ s, this machine, one run" instead of 265 ms.
import 'katex/dist/katex.min.css';
import { CAMERA_HOME, Camera, MathLabel, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number): number => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// The lab's constants (copied, cited above)
// ---------------------------------------------------------------------------

const VW = 1280; // defaultContext.viewportWidth
const VH = 800; // defaultContext.viewportHeight
const WRAP_SLACK = 0.004;
const SAMPLE_COUNT = 4000;
const START_COUNT = 12;
const STEPS = 150;
const WEIGHTS: { name: string; w: number }[] = [
  { name: 'fill', w: 0.25 },
  { name: 'verticalFit', w: 0.2 },
  { name: 'importanceMatch', w: 0.15 },
  { name: 'balanceX', w: 0.1 },
  { name: 'sizeComfort', w: 0.1 },
  { name: 'rowEvenness', w: 0.05 },
  { name: 'contentRichness', w: 0.15 },
];
const RICH_SLOTS = 10;
const RICH_W = WEIGHTS[6].w;
if (Math.abs(WEIGHTS.reduce((a, b) => a + b.w, 0) - 1) > 1e-9) throw new Error('generative-fields ch2: weights must sum to 1');

// ---------------------------------------------------------------------------
// Data block (dumped from the pinned lab code; see the header)
// ---------------------------------------------------------------------------

type Geo = number[][]; // per slot: x, y, width, height, visible (viewport px)
const KINDS =
  'ccvccccvcccvvccccvcvvcccccccccccccccvcvccvvcccccvcvcvccvccvvcccvcvcvvccccccvcccvcvccvcvvcvccccvcvvcc' +
  'cvcvcccccvccccccvcccccvcvvccvcvcvvcvcvccccvcvvccvccvvvcccvccsvccvcvcccccvcccvvvcvccccvcccccvcvcvcvcv' +
  'vvccvccccccvcvcvcccccccccccccvvcvcvvccscccvvcccvcccccvcccvcvccvvccccvccscccccvcccvccccccvcvvcccccccc' +
  'cccvcccccccvccccvccccvcccvcccccvcccccccccvccccccvcvccccccccvcccccvvcccccccvvcccvvccccvccccvvvccvccbc' +
  'cccccccvcscvvcvcvccccccccvcccccccccvcvccvvccccccccvvcvccvcccccccvccccccccccccccvcccvcccscccvcccccccc' +
  'cccccccvvccccvccccvvvvcccvvbccvccvvccccccvccscccccccccccccccccccccccscvvcvcvccccccccccvvcccvccccvvvc' +
  'vcccvccccccccvccvccccvvcvccccccvccvccccvcccccccccvccvscccvcccccccccvccccvvccccccccccvvvcvcvcvccvcvcc' +
  'ccvvccvvvcccccccvccccvcccccvccscvccccccccccccccccvccccvccvccvccccccvcccccccccvcccvcvccvcvcvccccccccv' +
  'ccccvccccccvcvbvccvccccvccvcvvcccvcvcvccvcvcvcccccvcvcccvcbcccccvcvvccccccvcccvvccccccccvccccccccccv' +
  'cccvcvccvvcvccccccvvvvcccccccvcccccccccccvcvvcvcccccvcccvccvcvccvccvcvcvvccvcbccvccccccccccccvcccvvc' +
  'cvvcvcccccccccvcvvcccvccvvccvccccccccvccvvcccccvcccccvvcccccscvvcvccccvcccvccccvcvvccvccccccccccvcvc' +
  'cvccvccvccsccscccccccvccvcccvccccvcvvccccvvvvcvcccccccccccvcccvcvvcvvcvccvcvcccccvccccvcvvcvcccccccc' +
  'cccccvvcvvvcvcvccvvvcccvccccccvccccvcvvccvccvvcvcccccccccccvcvcccccccccccvcccccvvvscccccvvcccccccccv' +
  'cvcccvcccvvsvccccccccvccvcvvccccccvccvvcvcvcvccvcccvvccccccvccvcccccccccccsvcccvccvcvccvcvcccccccccc' +
  'cccvcccvcccvvccccccvcvccvccvcccvcvcvccccccvvvcccvccvccvcccvcccvcccbvvcvcvvvcccvccvccvvcccvcvccccvccc' +
  'vcccvccccvvcccvvcccccccccccvvccccvvvcvccccccccccvcvccvccvcvccccccvcvccccvcccccvccccccvccccvcvcccvccc' +
  'vccvcvccccccvcccccccccvccccccccvccvcccsvcccvcvccvvccvvcvccvvccvccccccccvcvcccvvccvcscccvvccccccvvccc' +
  'cccvccccccvvvvvcvccvcvvcccvccccvcvcccccccvcvvcccvvcvccvccvcvvvccvcccvccvcccccccccccccccccccvcvcvcvcc' +
  'ccccccvvcccccccvccccccvcccccccccccccvvccvccccvcvcvcscvvccccccccvccvvcccvcccvcvccccccvccccccccccvcvcc' +
  'vcvvccccccccvccccccccvvccvvvcccvvcsccccccvcvccvccvccccccvccvccvccvcccccccvsvccccvvcccvcccvcvvcccccvv' +
  'cccvccvcvvcvccvccvccvcvccccvcvvvcvccccvccccccccvccccvccvccsvccvcccvvcccvvcccccccvcvvccccccccccvcvccv' +
  'vcvccccvcccvcccvvccccvccccccvccsccccccvcvcvccvcvcvccccccccccvccvccvcvvcvcvcvcvccccccccvcccccvccccccv' +
  'cccccccccccvvvcccccvvcccvcvvvcvccvccccccccccccvcvccvcccvcvccvcccccccccvcvcvccvvvcccccvccccvcccccvccc' +
  'vccvccccccvccccvccvcccccvcvccvcvccccccscvccccvccvcccccvvsvcccccccvcccccvcvccvcccvccvccvvvcvcvccvcvcv' +
  'vcvcccvvcccccccvcccccsccccccccvccvcvcvcccccvccvcccsvccccccccccvccvvcccccccccccccccvvcccvccvcccvccvvc' +
  'cvvcvccccccccvvccvcscvcccvccvvcvcvcccccccccccccccccccvccvcccvvcccvccvccvccccvccccccccccvcccvsccccccc' +
  'cvcvvccccvccvvccvcvccvcvcccvcccccvcvvccccvcccccccccccvvvcvcvccvcccvvccccccccvcccccccvvcvccccccvccvcc' +
  'vccccccvvvvcccvcvcccccvcvccvcvvcccvccvccvcvvvccvvccvcccvcccccvcvcccccvcvccvvcvvccccvcvvccccvcvvccvvc' +
  'cvcccccscsvvcccvcvcccccvvvccccvccccccvccvccvvccvvccccvvccccccccccccvccccccvccvvcvcvcvvvvvvcccvcvcccc' +
  'cccvvvccccccccvccccccvvcccccccvvvcvvvcvcccvccvcvcvccvccccccccccccvvccvccccvcvcccccvcccvcccccccvscccc' +
  'vccvcccccccccvcvvvvccccccccvvccvvcvcccccvvccvcvcvccvccccvccccccvccccccccccccccvccvcccvccccvvcssvcccc' +
  'cvvccccvccvcccvvcccccccccvccvcccvvvccccvvvvvvcccvccvcvcvvvccccccvcvccccccvcvvvcvvcccccccvvcvcvscvccc' +
  'ccvvccccccvvvcccccccvcccvvvvccccccccvcccvcvvccvccccvvcvcvccvccvvcccccccccccccccccccvcvcvcccccvvvcvcc' +
  'vccvccccvvcccccccvcccccccsvvccccccccccvcvccvcvvvvcvvcccvccvvccvvccvccccccccvcvccvcccvvccccvccccccccc' +
  'scccvcvccccccccccccvvccvvcccccvcvcvccvcccvccccccvcvccccccccvccvccccccvvcccvccvccccvccvccvvcccvcccccc' +
  'cccvccvccccccccccccccvvvcccvvcccccccccvcvvcccvcccvvvcccccccccvvcvvcccccccvccvccvvccvcccvccvcvccvcccc' +
  'cccccccbccvcccccccccccccvcccccvccccccccccccvcvvcccvvvcccvcvccccccvvcccccccvvcvccccvcccvvcccvccvcvccc' +
  'vccvcvcccccvvccccccccvcvvcvcccccvccccccccvvccccccvcvvvvcccvccvvcccvvcccvvccccvccccvcccvcvvvvcccvvvcc' +
  'vcvcvcccccccvccvcccvccccvccccccvccccvccccccvvvvccvccccvvvcccvccvcccvvccccccccvvccccvccvvccvvccccccvc' +
  'ccccccvcccvccccvvcccccvcccccccvcvcccccvcvcccccvcbccccccvccccccccvcccvcccccccccccccvcccvcccccvccvvccc';
const FIT_CODES =
  '845636567603560609680586586489604726736691758594798717535563802647699674699574657777718631703697821683' +
  '579726483658579629632587765836786814674599350736321778677647594632699633714594750704752781611678654724' +
  '759558570723492815572798604777654617589712565813751730735709403813647740667796493599765538525711719835' +
  '656661645731711737664767765635757687539714637650671620546687453564704616593569700633724593708674715706' +
  '626617852527733791555678580808297457625722744700716612593769743606798452671727755646545722535824501561' +
  '581619610510727636795736744626763520533574720661559327656527674762608607738790723671642714799578756522' +
  '690668689553738688710603749612666609653642716807583804677775743748623749765725655736702655802574488629' +
  '594718683705579593621715577752545708711710767623669688664661713737722729577759475563710717534825606724' +
  '765489765735732584829636597694646814620746742546647747652684701698671528807530569692792711719490787759' +
  '698527671603637686776669579735655800827719635796789650757773635575655626486525627697596510546627802684' +
  '719708724772481622583720749794643552609792710614637616779585531593609686608739752801640633552715499607' +
  '756733576775715677786813683699622645792767605534763778634626645699792596720563799622654721655799578639' +
  '741645713656623806538699649627767732822691674761670786653723472660772500844753694524753654671680702543' +
  '717822671743750781737822708726738575469716875565590643746677748814684674630820810741617732848600674737' +
  '773519763709739727676766624598572651815768592472648679773558786703836797742700751809800751727691557755' +
  '640628581726583783841593693714738601706614784689767701636775750655543727756699715745677669662665696737' +
  '632733602779777544750561692691553746733740566761640762648493598609668781526724485768470611590649842641' +
  '794721617536833745758589581744654511677790656587726824686793569862463606595708648643690818593636711561' +
  '598710698547851834736760748750672655557488669540786592634640710614712653663695720718632536758850692752' +
  '633686460746673667791666690481812745805823733438548659590508590641822720682653760870535608745677773473' +
  '641647789721587481770651558713790704703421701730572747717758646696746731839665786570798543688533812704' +
  '568724729700552749655603771572787644605622710771609453560736824695332774716836657657693718753618782634' +
  '664768740728786728546741624643673801660788640703799686626694744806758696656655584759634343594669659718' +
  '668726765632628725748624844704719642793632743637798729765651734597670631610700756615507717633712639657' +
  '813784774746636717573562755803655604743781683539703705610584691495641611602691705571703650692779647748' +
  '536722586735732643680816448662824601788503659521770648738600590768674828659710623720784796735692810700' +
  '678676708718679777725738709723799809738697756791640520824801720673685686669539689733610741526541805718' +
  '733674607548741632630843747813622656494644677315512671722553658724654680637851529755683782616714818726' +
  '802621619470754488602725701561663531623625766706723818714742387679731748647556720485630510662751651653' +
  '757782662775620722542677739769758824758770633643485736584532537650782778739505691743608563765742678684' +
  '703512750787728675798694539748730628841688532482776806665703745759555741814567716706865774836611735605' +
  '690538828585783620800757858729749629520682648778698685654757725617833675';
const TRAIL_CODES = [
  '000000000000622622637660686715748784784784784784784784784784784784793793793793793793793793793793793793793793794813813813813813813813813813813813813813813818838838838838838838842842842842842842842842842859859859869869869869869878878878878878878878878878878890890890894894894894894894894894894894894901901901901901901901901901901901901901901901901901901901904904904904907907907907907907907907907907907907907907907907907907907907907907907907907907907907907',
  '000000000000755755755755755755755755755755755755755755755755755755755755755756768780792806821837853853853862862862862862862862862862862862862862862862862862862862871871878878878878878880890903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903903',
  '000000000763763763763763763763763763763763763763763763763763763763763763763763763763763768768768768768768768768768768768768768768768768768768768768777797818818818841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841841843843845845845845845848848851851853859859',
  '595649738814814814814814814814814814814814814814814814814814814814814814814814814814814814814814829829829829837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837837845845845851851851851851858858858858858858858858858858858869869869869869869869873873873873',
  '000809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809809817817817820820820820820821832832845847847847847847847854854854854854854854854854854854854854854854854854854854854868868868874874874874874874874874874874874874874877877877',
  '000000763769773790834853853853853853853853853853853853853853853853853853853853853853853853853853853853853882882882883891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891891',
  '000000746746746746746746746746746746746746746746746746746765765765765765765765765765765765765765765765765765765765765765765765765765765765783803803803820820820820820820820820820820820820820820820820820820820820820820820823823823823823823823823823823823825825825827827827827827827827831831831831831831831831831831831831831831831831831837837837837846846846846846846846846846846846846846846846846848848848848848848848848848849849849849849849849849849849849',
  '705731731731786786786786786786786786786786786786786786786786786786825825856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856856871871871877877877877877879879891892900900900900900900900900900900900900900900900900900900919919919919919919919919919',
  '000000000000757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757757771787804804804804809809809809809809809809813823823823823823823823823823823828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828828830830830830830830830830830830835850850850855855855855855863863',
  '777777777777777777777777777777777777777777777777777777777777777777777777783800800800800800800800800800800800800800800800800800800800800800800800800800800800800800800800803803803803803803803803803803803803803803803803803803803803803803809830853853853853877877877877877877877877884893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893893895895895895895895895895895895',
  '000000751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751751757770783797811826826826826826826826826826826826826826826826826826826826826826826826826828828828828828828835843853853853862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862862871888888888888888888888888888',
  '000758758759759773773773773773773773773773773773773773773773773782810843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843843844844844844844844844844844844853853853855855855855855855855855855855855855855',
];
// prettier-ignore
const GEO_S4: Geo = [[0, 0, 0, 0, 0], [22, 149.3, 708.4, 83.8, 1], [22, 832.4, 794.2, 73.5, 1], [22, 703, 729.5, 120.9, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [22, 44.5, 744.6, 96.2, 1], [0, 0, 0, 0, 0], [22, 562.9, 929.2, 131.5, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [22, 241.6, 857, 200.5, 1], [0, 0, 0, 0, 0], [22, 914.5, 717.8, 118.7, 1], [22, 450.7, 818.2, 103.7, 1]];
// prettier-ignore
const GEO_S7: Geo = [[0, 0, 0, 0, 0], [221, 20.3, 149.9, 82.7, 1], [748.2, 20.3, 155.4, 217.3, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [927.6, 20.3, 155.3, 135.9, 1], [0, 0, 0, 0, 0], [394.9, 20.3, 151.2, 155.8, 1], [225.3, 299.8, 152.1, 99.7, 1], [570.1, 20.3, 154.2, 271.5, 1], [47.5, 20.3, 149.6, 75.5, 1], [0, 0, 0, 0, 0], [47.5, 299.8, 153.8, 238.4, 1]];
// prettier-ignore
const GEO_SEARCH: Geo = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [35.2, 371.6, 208.8, 160.8, 1], [35.2, 579.6, 516.3, 118.8, 1], [935.5, 371.6, 284, 138.3, 1], [587.2, 579.6, 343.5, 173.7, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [713.6, 42.4, 515.1, 128.6, 1], [0, 0, 0, 0, 0], [279.8, 371.6, 620.1, 191.6, 1], [35.2, 187.4, 732.7, 167.7, 1], [35.2, 42.4, 642.7, 117, 1], [803.6, 187.4, 374.8, 71.1, 1], [0, 0, 0, 0, 0]];
// prettier-ignore
const GEO_ASCENT: Geo = [[0, 0, 0, 0, 0], [9.4, 267, 1247.8, 148.8, 1], [0, 0, 0, 0, 0], [9.4, 23.2, 1235.1, 143.9, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [9.4, 654, 1191.1, 122.2, 1], [9.4, 415.7, 1192.7, 124.4, 1], [9.4, 167.1, 1146, 99.9, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [9.4, 540.2, 1167.7, 113.8, 1]];
// prettier-ignore
const GEO_SLAB: Geo = [[0, 0, 1280, 500, 1], [0, 500, 1280, 300, 1], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];

// sample 4 (search seed 0x5EED): the circuit's own outputs and the two padding knobs
const S4 = { index: 4, depth: 496.72509765625, paddingX: 21.957006454467773, paddingY: 44.5290641784668, innerWidth: 1236.0859870910645 };
const S7_INDEX = 7;
const SEARCH_BEST = 1731;
const BEST_TRAIL = 7;

// ---------------------------------------------------------------------------
// Re-derive the test's numbers from the block, and stop if they disagree
// ---------------------------------------------------------------------------

const N = KINDS.length;
const count = (pred: (k: string) => boolean): number => [...KINDS].filter(pred).length;
const VALID = count((k) => k === 'v');
const CONTAIN = count((k) => k === 'c' || k === 'b');
const SIZE = count((k) => k === 's' || k === 'b');
const INVALID = N - VALID;
const FIT = (FIT_CODES.match(/.../g) ?? []).map(Number);
if (N !== SAMPLE_COUNT || VALID !== 1078 || CONTAIN !== 2886 || SIZE !== 44 || FIT.length !== VALID) {
  throw new Error('generative-fields ch2: search counts disagree with generation.test.ts');
}
const VALID_PCT = ((100 * VALID) / N).toFixed(1); // experiments.ts:151, same expression → "26.9"
const VALID_IDX: number[] = [];
for (let i = 0; i < N; i++) if (KINDS[i] === 'v') VALID_IDX.push(i);
const FIT_OF = new Map(VALID_IDX.map((s, k) => [s, FIT[k]]));
const FIT_MAX = Math.max(...FIT);
if (FIT_OF.get(SEARCH_BEST) !== FIT_MAX || FIT_MAX !== 875) throw new Error('generative-fields ch2: search top is not sample 1731 at 0.875');
if (KINDS[S4.index] !== 'c' || KINDS[S7_INDEX] !== 'v') throw new Error('generative-fields ch2: sample 4 / 7 verdicts');

const TRAILS: (number | null)[][] = TRAIL_CODES.map((s) => (s.match(/.../g) ?? []).map((c) => (c === '000' ? null : Number(c) / 1000)));
const FINALS = TRAILS.map((t) => t[STEPS]);
if (TRAILS.length !== START_COUNT || TRAILS.some((t) => t.length !== STEPS + 1) || FINALS.some((v) => v === null)) {
  throw new Error('generative-fields ch2: trails must be 12 × 151 and all end valid');
}
const SORTED = (FINALS as number[]).slice().sort((a, b) => a - b);
const pct = (f: number): number => SORTED[Math.min(SORTED.length - 1, Math.max(0, Math.round(f * (SORTED.length - 1))))]; // search.ts:133-139
const BEST = SORTED[SORTED.length - 1];
const MEDIAN = pct(0.5);
const WORST = SORTED[0];
if (BEST !== 0.919 || MEDIAN !== 0.888 || WORST !== 0.849 || FINALS[BEST_TRAIL] !== BEST) {
  throw new Error('generative-fields ch2: climb statistics disagree with the printed run');
}
const ENDED_VALID = FINALS.filter((v) => v !== null).length;
const visibleOf = (g: Geo): number => g.filter((r) => r[4] === 1).length;
const VIS_SEARCH = visibleOf(GEO_SEARCH);
const VIS_ASCENT = visibleOf(GEO_ASCENT);
if (VIS_SEARCH !== 9 || VIS_ASCENT !== 6 || visibleOf(GEO_SLAB) !== 2) throw new Error('generative-fields ch2: visible counts');
const RICH = (n: number): number => Math.min(1, n / RICH_SLOTS);

// Sample 4's containment overshoots (flow-layout.ts:366-381): bottom edges past viewportHeight − paddingY.
const BOTTOM_LIMIT = VH - S4.paddingY;
const OVERSHOOTS = GEO_S4.map((r, slot) => ({ slot, over: r[4] ? r[1] + r[3] - BOTTOM_LIMIT : 0 })).filter((o) => o.over > 0.5);
if (OVERSHOOTS.length !== 3 || Math.abs(OVERSHOOTS.reduce((a, o) => a + o.over, 0) - S4.depth) > 0.4) {
  throw new Error('generative-fields ch2: sample 4 overshoots do not add up to its violationDepth');
}
const WRAP_MARGIN = S4.innerWidth * WRAP_SLACK; // ≈ 4.9 px
const RIGHT_LIMIT = S4.paddingX + S4.innerWidth + WRAP_MARGIN;

// Sample 7's first row (the cursor beat): the slots sharing the top row, left to right.
const ROW1 = GEO_S7.map((r, slot) => ({ slot, r })).filter((o) => o.r[4] === 1 && Math.abs(o.r[1] - GEO_S7[13][1]) < 0.5).sort((a, b) => a.r[0] - b.r[0]);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 50;
// the opening card (sample 4, then sample 7)
const CARD_A = { x: 150, y: 116, s: 0.36 };
const LIGHTS = { x: 652, y: 126, w: 250, h: 128 };
const RULES = { x: 652, y: 290 };

// the search field: 80 × 50 dots, one per sample, in sample order
const COLS = 80;
const PITCH = 6.8;
const FX0 = 70;
const FY0 = 140;
const DOT_R = 2.1;
const dotX = (i: number): number => FX0 + (i % COLS) * PITCH + PITCH / 2;
const dotY = (i: number): number => FY0 + Math.floor(i / COLS) * PITCH + PITCH / 2;
const ROWS = Math.ceil(SAMPLE_COUNT / COLS);

// the score chart (fitness up, steps across)
const AX = 720;
const SY0 = 0.25;
const sy = (v: number): number => 560 - ((v - SY0) / (1 - SY0)) * 450;
const FLOOR_Y = 590;
const TX0 = 740;
const TX1 = 1120;
const tx = (step: number): number => TX0 + (step / STEPS) * (TX1 - TX0);

// the histogram the valid dots fly into: 0.01 bins, stacked rightwards from the axis
const BIN_COUNTS = new Map<number, number>();
const HIST_POS = VALID_IDX.map((s) => {
  const bin = Math.floor(FIT_OF.get(s)! / 10);
  const k = BIN_COUNTS.get(bin) ?? 0;
  BIN_COUNTS.set(bin, k + 1);
  return { s, bin, k };
});
const PEAK = Math.max(...BIN_COUNTS.values());
const HDX = Math.min(4.4, 300 / PEAK);
const HIST_XY = HIST_POS.map(({ bin, k }) => [AX + 6 + k * HDX, sy(bin / 100 + 0.005)]);
// fly order: from the top score down, so the winner lands first
const FLY_RANK = (() => {
  const order = VALID_IDX.map((_, k) => k).sort((a, b) => FIT[b] - FIT[a]);
  const rank = new Array<number>(order.length);
  order.forEach((k, r) => (rank[k] = r));
  return rank;
})();
const TOP_XY = HIST_XY[VALID_IDX.indexOf(SEARCH_BEST)];

const circ = (x: number, y: number, r: number): string => `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
const ROW_PATHS = Array.from({ length: ROWS }, (_, r) => {
  let d = '';
  for (let i = r * COLS; i < Math.min(SAMPLE_COUNT, (r + 1) * COLS); i++) d += circ(dotX(i), dotY(i), DOT_R);
  return d;
});
const kindPath = (pred: (k: string) => boolean): string => {
  let d = '';
  for (let i = 0; i < N; i++) if (pred(KINDS[i])) d += circ(dotX(i), dotY(i), DOT_R);
  return d;
};
const PATH_VALID = kindPath((k) => k === 'v');
const PATH_CONTAIN = kindPath((k) => k === 'c');
const PATH_SIZE = kindPath((k) => k === 's' || k === 'b');

// the twelve trails as step polylines: the running best only moves up, so draw it as stairs
const TRAIL_XY = TRAILS.map((t) => t.map((v, step) => [tx(step), v === null ? FLOOR_Y : sy(v)]));
const trailPath = (pts: number[][], upTo: number): string => {
  const n = Math.max(0, Math.min(pts.length - 1, upTo));
  const whole = Math.floor(n);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= whole; i++) d += `H${pts[i][0].toFixed(1)}V${pts[i][1].toFixed(1)}`;
  if (whole < pts.length - 1 && n > whole) d += `H${lerp(pts[whole][0], pts[whole + 1][0], n - whole).toFixed(1)}`;
  return d;
};

// the closing pair and the richness plot
const RP = { x0: 100, x1: 400, y0: 276, y1: 150 };
const rpx = (n: number): number => RP.x0 + (n / 16) * (RP.x1 - RP.x0);
const rpy = (v: number): number => RP.y0 + v * (RP.y1 - RP.y0);
const CARD_SEARCH_B7 = { x: 930, y: 232, s: 0.2 };
const CARD_PAIR_L = { x: 90, y: 370, s: 0.2 };
const CARD_PAIR_R = { x: 384, y: 370, s: 0.2 };
const CARD_ASC = { x: 90, y: 118, s: 0.3 };
const CARD_SLAB = { x: 90, y: 440, s: 0.16 };

const CAM_B1: CameraState = { x: 560, y: 318, k: 1.18 };
const CAM_B2: CameraState = { x: 540, y: 350, k: 1.16 };
const CAM_B3: CameraState = { x: 480, y: 262, k: 1.4 };
const CAM_FIELD: CameraState = { x: 340, y: 330, k: 1.22 };
const CAM_TOP: CameraState = { x: 900, y: 320, k: 1.25 };
const CAM_STE: CameraState = { x: 350, y: 420, k: 1.28 };
const CAM_GAUGE: CameraState = { x: 470, y: 430, k: 1.28 };
const CAM_CLIMB: CameraState = { x: 930, y: 360, k: 1.1 };

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, paced at ~150 words a minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'The circuit grades its own work. It outputs a validity bit that is exactly one or zero, plus a depth in pixels saying how badly a layout breaks the rules.',
  'Three rules are checked: no two visible slots overlap, nothing runs past the bottom or right edge, and nothing is too small. The right edge allows a small wrap margin, and a half-pixel tolerance applies.',
  'Sideways overlap is impossible by construction, since the cursor only moves forward and spans are capped. Overlap never occurred in four thousand samples; only a crafted triple of almost-equal keys can cause it.',
  'The first way to find a layout is search. Draw four thousand random field vectors, and test each one.',
  'Only one thousand seventy-eight are valid, about twenty-seven percent. The most common failure is spilling out of the viewport: two thousand eight hundred eighty-six samples.',
  'To rank the valid ones, seven weighted terms add up: fill, vertical fit, importance match, balance, size comfort, row evenness and content richness. Any valid layout beats any invalid one.',
  "Search's best layout scores point eight seven five. The whole four-thousand-sample search took about a quarter second on this machine.",
  'The second way is to slide uphill. Gradient ascent minimizes minus fitness plus a small penalty on violation depth, taking one hundred fifty steps from each of twelve random starts.',
  'But decisions in this circuit are bits, and bits have no slope. So the backward pass fakes one, a straight-through estimate: forward values stay exact, and the derivative through a decision is set to one.',
  'That fake slope is biased. On one probe the readme measured one hundred seventy-three where the true local slope was one hundred twenty, so the magnitudes are not derivatives.',
  "In today's run, all twelve climbs end valid, with a best of point nine one nine, a median of point eight eight eight, and a worst of point eight four nine. Search's best was point eight seven five.",
  'Yet the best climbed layout shows only six slots out of sixteen. Fitness can be gamed: with the richness term removed, a hand-built layout with just two visible slots scored a perfect one.',
  'The richness term now rewards up to ten visible slots, but climbing still prefers six. Search and gradient optimize the same number and disagree about taste, so the fitness function is the bottleneck.',
];

const NAMES = [
  'src',
  // B1-B3: the card
  'cardU', 'light1U', 'light2U', 'overU', 'rulesU', 'contSpot', 'limitU', 'arrowsU', 'edgeU', 'slackU',
  'morphU', 'cursorU', 'ghostU', 'counterU', 'tripleU', 'lightsOp', 'rulesOp', 'shrinkU',
  // B4-B7: search
  'fillU', 'searchLblU', 'litU', 'validCntU', 'spotC', 'catCntU', 'weightU', 'chartU', 'flyU', 'floorU',
  'topU', 'lineU', 'topLblU', 'scardU', 'timeU', 'fieldOp', 'histOp',
  // B8-B11: climbing
  'stepAxisU', 'lossU', 'lossOp', 'startsU', 'cfgU', 'steU', 'stepPlotU', 'slopeU', 'badgeU', 'steOp',
  'gaugeU', 'bar1U', 'bar2U', 'phantomU', 'sweepU', 'endsU', 'validChipU', 'julyU',
  // B12-B13: the gamed number
  'focusU', 'ascU', 'slabU', 'pairU', 'richU', 'arrowU', 'tasteU', 'finalU', 'chartOp',
] as const;
type Name = (typeof NAMES)[number];
const INIT: Partial<Record<Name, number>> = { lightsOp: 1, rulesOp: 1, fieldOp: 1, histOp: 1, lossOp: 1, steOp: 1, chartOp: 1 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const C = Object.fromEntries(NAMES.map((n) => [n, tl.channel(n, INIT[n] ?? 0)])) as Record<Name, ChannelRef<number>>;
  const tw = (k: Name, to: number, at: number, dur: number, e: (u: number) => number = ease.move) => tl.tween(C[k], to, { at, dur, ease: e });
  const go = (to: CameraState, at: number, dur = 1.3) => tl.tween(cam, to, { at, dur, ease: ease.move });

  // one caption per line, spoken at ~2.6 words a second, then a short hold
  const caps: { at: number; dur: number }[] = [];
  let t = 0.4;
  for (const text of CAPTIONS) {
    const dur = +(text.split(/\s+/).length / 2.6 + 0.3).toFixed(1);
    caps.push({ at: t, dur });
    tl.caption({ at: t, dur, text });
    t = tl.hold(t + dur, 0.6);
  }
  const end = t;
  caps.forEach((c, i) => tl.set(C.src, i, Math.max(0, c.at - 0.1)));

  // — B1 · the circuit grades its own work —
  let c = caps[0].at;
  tw('cardU', 1, c - 0.2, 0.8, ease.enter);
  go(CAM_B1, c + 0.6, 1.4);
  tw('light1U', 1, c + 1.8, 0.7, ease.pop);
  tw('overU', 1, c + 5.0, 0.8, ease.enter);
  tw('light2U', 1, c + 5.6, 0.7, ease.pop);

  // — B2 · three rules, a wrap margin, a half pixel —
  c = caps[1].at;
  go(CAM_B2, c, 1.2);
  tw('rulesU', 3, c + 0.3, 1.5, ease.linear);
  tw('contSpot', 1, c + 3.4, 0.6, ease.enter);
  tw('limitU', 1, c + 3.6, 1.0, ease.draw);
  tw('arrowsU', 1, c + 4.6, 0.8, ease.enter);
  tw('edgeU', 1, c + 7.2, 0.8, ease.enter);
  tw('slackU', 1, c + 9.6, 0.6, ease.enter);

  // — B3 · the cursor only moves forward —
  c = caps[2].at;
  tw('limitU', 0, c, 0.5);
  tw('arrowsU', 0, c, 0.5);
  tw('edgeU', 0, c, 0.5);
  tw('overU', 0, c, 0.5);
  tw('slackU', 0, c, 0.5);
  tw('contSpot', 0, c, 0.5);
  tw('rulesOp', 0.12, c, 0.6);
  tw('morphU', 1, c + 0.2, 1.2);
  go(CAM_B3, c + 0.6, 1.3);
  tw('cursorU', 1, c + 2.0, 3.0, ease.linear);
  tw('ghostU', 1, c + 5.2, 0.6, ease.enter);
  tw('counterU', 1, c + 6.6, 0.6, ease.enter);
  tw('tripleU', 1, c + 9.2, 0.6, ease.enter);

  // — B4 · search: four thousand tries —
  c = caps[3].at;
  go(CAMERA_HOME, c, 1.4);
  for (const k of ['ghostU', 'counterU', 'tripleU', 'cursorU'] as const) tw(k, 0, c, 0.5);
  tw('lightsOp', 0, c, 0.6);
  tw('rulesOp', 0, c, 0.6);
  tw('shrinkU', 1, c + 0.3, 1.2);
  tw('searchLblU', 1, c + 0.8, 0.6, ease.enter);
  tw('fillU', 1, c + 1.2, 3.0, ease.linear);

  // — B5 · 1,078 valid; containment dominates —
  c = caps[4].at;
  go(CAM_FIELD, c, 1.2);
  tw('litU', 1, c + 0.6, 1.0, ease.enter);
  tw('validCntU', 1, c + 1.4, 0.6, ease.pop);
  tw('spotC', 1, c + 5.0, 0.8);
  tw('catCntU', 1, c + 5.2, 0.6, ease.enter);

  // — B6 · seven weighted terms; valid beats invalid —
  c = caps[5].at;
  go(CAMERA_HOME, c, 1.2);
  tw('spotC', 0, c, 0.6);
  tw('catCntU', 0, c, 0.5);
  tw('weightU', 1, c + 0.5, 1.0);
  tw('chartU', 1, c + 3.6, 1.2, ease.draw);
  tw('flyU', 1, c + 7.6, 2.4);
  tw('floorU', 1, c + 8.6, 0.6, ease.enter);

  // — B7 · search's best: 0.875 —
  c = caps[6].at;
  go(CAM_TOP, c, 1.3);
  tw('searchLblU', 0, c, 0.5);
  tw('weightU', 0, c, 0.6);
  tw('validCntU', 0, c, 0.5);
  tw('floorU', 0.12, c, 0.6);
  tw('topU', 1, c + 0.6, 0.5, ease.pop);
  tw('lineU', 1, c + 1.0, 1.0, ease.draw);
  tw('topLblU', 1, c + 1.4, 0.6, ease.enter);
  tw('scardU', 1, c + 2.4, 0.8, ease.enter);
  tw('timeU', 1, c + 4.6, 0.6, ease.enter);

  // — B8 · the second way: climb —
  c = caps[7].at;
  go(CAMERA_HOME, c, 1.3);
  for (const k of ['scardU', 'timeU', 'topLblU', 'topU', 'floorU'] as const) tw(k, 0, c, 0.5);
  tw('fieldOp', 0, c, 0.8);
  tw('histOp', 0.1, c, 0.8);
  tw('stepAxisU', 1, c + 0.8, 1.2, ease.draw);
  tw('lossU', 1, c + 2.6, 0.6, ease.enter);
  tw('startsU', 1, c + 5.6, 0.8, ease.enter);
  tw('cfgU', 1, c + 6.4, 0.6, ease.enter);

  // — B9 · bits have no slope: straight-through —
  c = caps[8].at;
  go(CAM_STE, c, 1.3);
  tw('lossOp', 0.12, c, 0.6);
  tw('chartOp', 0.1, c, 0.6);
  tw('steU', 1, c + 0.5, 0.6, ease.enter);
  tw('stepPlotU', 1, c + 1.0, 1.0, ease.draw);
  tw('slopeU', 1, c + 5.0, 1.0, ease.draw);
  tw('badgeU', 1, c + 7.0, 0.6, ease.pop);

  // — B10 · the fake slope is biased: 173 vs 120 —
  c = caps[9].at;
  go(CAM_GAUGE, c, 1.2);
  tw('gaugeU', 1, c + 0.4, 0.6, ease.enter);
  tw('bar1U', 1, c + 2.0, 1.0, ease.draw);
  tw('bar2U', 1, c + 3.8, 1.0, ease.draw);
  tw('phantomU', 1, c + 5.6, 0.6, ease.enter);

  // — B11 · twelve climbs, all valid —
  c = caps[10].at;
  go(CAM_CLIMB, c, 1.3);
  tw('chartOp', 1, c, 0.8);
  tw('steOp', 0, c, 0.6);
  tw('lossOp', 0, c, 0.6);
  tw('cfgU', 0, c, 0.6);
  tw('sweepU', STEPS, c + 0.8, 5.6, ease.linear);
  tw('endsU', 1, c + 3.4, 0.6, ease.enter);
  tw('validChipU', 1, c + 7.4, 0.6, ease.enter);
  tw('julyU', 1, c + 9.6, 0.6, ease.enter);

  // — B12 · the best climb shows six; two slabs scored one —
  c = caps[11].at;
  go(CAMERA_HOME, c, 1.3);
  tw('focusU', 1, c + 0.2, 0.8);
  tw('julyU', 0, c, 0.5);
  tw('validChipU', 0, c, 0.5);
  tw('ascU', 1, c + 1.0, 0.8, ease.enter);
  tw('slabU', 1, c + 5.6, 0.8, ease.enter);

  // — B13 · same number, different taste —
  c = caps[12].at;
  tw('slabU', 0, c, 0.5);
  tw('pairU', 1, c + 0.4, 1.2);
  tw('richU', 1, c + 1.4, 1.0, ease.draw);
  tw('arrowU', 1, c + 5.4, 0.8, ease.enter);
  tw('tasteU', 1, c + 6.4, 0.6, ease.enter);
  tw('chartOp', 0.12, c + 8.0, 0.8);
  tw('finalU', 1, c + 8.6, 0.8, ease.enter);
  tl.hold(end, 2.0);

  return { tl, cam, C };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Txt({ x, y, text, color = colors.TEXT, fs = 13, mono = false, anchor = 'start', opacity = 1, weight }: {
  x: number; y: number; text: string; color?: string; fs?: number; mono?: boolean; anchor?: 'start' | 'middle' | 'end';
  opacity?: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={fs} fontFamily={mono ? MONO : UI} opacity={opacity} fontWeight={weight}>
      {text}
    </text>
  );
}

function Chip({ x, y, text, color, opacity = 1, fs = 13, mono = false, anchor = 'start', fill }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; mono?: boolean; anchor?: 'start' | 'middle' | 'end'; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? CH13 * (fs / 13) : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill ?? colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

/** A 1280 × 800 viewport at scale s; slots morph from geometry a to b (fading where visibility differs). */
function LayoutCard({ a, b = a, u = 0, x, y, s, opacity = 1, nums = true, spill = 0, highlight, title }: {
  a: Geo; b?: Geo; u?: number; x: number; y: number; s: number; opacity?: number; nums?: boolean; spill?: number;
  highlight?: (slot: number) => number; title?: string;
}) {
  if (opacity <= 0.005) return null;
  const slots = a.map((ra, i) => {
    const rb = b[i];
    const va = ra[4] === 1;
    const vb = rb[4] === 1;
    if (!va && !vb) return null;
    const r = va && vb ? ra.map((v, k) => lerp(v, rb[k], u)) : va ? ra : rb;
    const op = va && vb ? 1 : va ? 1 - u : u;
    return { i, r, op };
  });
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={VW * s} height={VH * s} rx={4} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.2} />
      {slots.map((o) => {
        if (!o || o.op <= 0.01) return null;
        const [gx, gy, gw, gh] = o.r;
        const hi = highlight ? highlight(o.i) : 0;
        const below = Math.max(0, gy + gh - VH);
        const sx = x + gx * s;
        const syy = y + gy * s;
        return (
          <g key={o.i} opacity={o.op}>
            <rect x={sx + 1} y={syy + 1} width={Math.max(0, gw * s - 2)} height={Math.max(0, gh * s - 2)} rx={2}
              fill={hi > 0.01 ? colors.TEAL : colors.ACCENT} fillOpacity={0.16 + 0.22 * hi} stroke={hi > 0.01 ? colors.TEAL : colors.ACCENT}
              strokeWidth={1 + hi} />
            {below > 0 && spill > 0.01 && (
              <rect x={sx + 1} y={Math.max(y + VH * s, syy + 1)} width={Math.max(0, gw * s - 2)} height={Math.min(gh, below) * s - 1} rx={2}
                fill={colors.NEGATIVE} fillOpacity={0.3 * spill} stroke={colors.NEGATIVE} strokeDasharray="4 3" opacity={spill} />
            )}
            {nums && gw * s > 26 && gh * s > 18 && (
              <text x={sx + 6} y={syy + 15} fill={colors.TEXT} fontSize={12} fontFamily={MONO} opacity={0.85}>
                {o.i}
              </text>
            )}
          </g>
        );
      })}
      {title && (
        <text x={x} y={y - 8} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {title}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, opacity = 1, w = 1.6 }: { x1: number; y1: number; x2: number; y2: number; color: string; opacity?: number; w?: number }) {
  if (opacity <= 0.005) return null;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  return (
    <g opacity={opacity} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${x2 - h * Math.cos(a - 0.45)},${y2 - h * Math.sin(a - 0.45)} L${x2},${y2} L${x2 - h * Math.cos(a + 0.45)},${y2 - h * Math.sin(a + 0.45)}`} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const g = (k: Name): number => s.get(scene.C[k]);

  // — card state —
  const cardU = g('cardU');
  const morphU = g('morphU');
  const shrinkU = smooth(g('shrinkU'));
  const t4 = { x: dotX(S4.index) - (VW * 0.002) / 2, y: dotY(S4.index) - (VH * 0.002) / 2, s: 0.002 };
  const cardX = lerp(CARD_A.x, t4.x, shrinkU);
  const cardY = lerp(CARD_A.y + 14 * (1 - cardU), t4.y, shrinkU);
  const cardS = lerp(CARD_A.s, t4.s, shrinkU);
  const cardOp = cardU * (1 - clamp01((shrinkU - 0.7) / 0.3));
  const isValid = morphU > 0.5;
  const lightsOp = g('lightsOp');
  const rulesU = g('rulesU');
  const rulesOp = g('rulesOp');
  const contSpot = g('contSpot');
  const limitU = g('limitU');
  const arrowsU = g('arrowsU');
  const edgeU = g('edgeU');
  const slackU = g('slackU');
  const cursorU = g('cursorU');
  const ghostU = g('ghostU');
  const counterU = g('counterU');
  const tripleU = g('tripleU');
  const cs = CARD_A.s;
  const cx = (gx: number): number => CARD_A.x + gx * cs;
  const cy = (gy: number): number => CARD_A.y + gy * cs;
  const row1Left = ROW1[0].r[0];
  const row1Right = ROW1[ROW1.length - 1].r[0] + ROW1[ROW1.length - 1].r[2];
  const cursorGX = lerp(row1Left, row1Right, cursorU);
  const row1Bottom = Math.max(...ROW1.map((o) => o.r[1] + o.r[3]));

  // — field state —
  const fillU = g('fillU');
  const litU = g('litU');
  const spotC = g('spotC');
  const fieldOp = g('fieldOp');
  const flyU = g('flyU');
  const histOp = g('histOp');
  const chartOp = g('chartOp');
  const chartU = g('chartU');

  // flying valid dots (field → histogram)
  let flyPath = '';
  if (flyU > 0.001) {
    const nv = VALID_IDX.length;
    for (let k = 0; k < nv; k++) {
      const u = smooth(flyU * 1.6 - 0.6 * (FLY_RANK[k] / nv));
      const i = VALID_IDX[k];
      const x0 = dotX(i);
      const y0 = dotY(i);
      const [x1, y1] = HIST_XY[k];
      const arc = -60 * Math.sin(Math.PI * u);
      flyPath += circ(lerp(x0, x1, u), lerp(y0, y1, u) + arc, lerp(DOT_R, 1.9, u));
    }
  }

  // — climbing state —
  const stepAxisU = g('stepAxisU');
  const startsU = g('startsU');
  const sweepU = g('sweepU');
  const endsU = g('endsU');
  const focusU = g('focusU');

  const ascU = g('ascU');
  const slabU = g('slabU');
  const pairU = smooth(g('pairU'));
  const richU = g('richU');
  const arrowU = g('arrowU');
  const tasteU = g('tasteU');
  const finalU = g('finalU');

  const ascPos = { x: lerp(CARD_ASC.x, CARD_PAIR_R.x, pairU), y: lerp(CARD_ASC.y, CARD_PAIR_R.y, pairU), s: lerp(CARD_ASC.s, CARD_PAIR_R.s, pairU) };
  const weightU = g('weightU');

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the opening card (sample 4 → sample 7) ======================== */}
        <LayoutCard a={GEO_S4} b={GEO_S7} u={smooth(morphU)} x={cardX} y={cardY} s={cardS} opacity={cardOp} nums={shrinkU < 0.2}
          spill={g('overU')} title={shrinkU < 0.2 ? (isValid ? `sample ${S7_INDEX} · seed 0x5EED` : `sample ${S4.index} · seed 0x5EED`) : undefined}
          highlight={(slot) => (cursorU > 0 && ROW1.some((o) => o.slot === slot) && cursorGX >= GEO_S7[slot][0] ? clamp01((cursorGX - GEO_S7[slot][0]) / 60) * (1 - g('shrinkU')) : 0)} />

        {/* overflow region below the viewport */}
        {g('overU') > 0.01 && shrinkU < 0.01 && (
          <Txt x={cx(VW) + 10} y={cy(VH) + 26} text="past the bottom" color={colors.NEGATIVE} opacity={g('overU') * (1 - morphU)} />
        )}

        {/* B2: the bottom limit and the overshoots */}
        {limitU > 0.01 && (
          <g opacity={1 - morphU}>
            <line x1={cx(0) - 8} y1={cy(BOTTOM_LIMIT)} x2={cx(0) + (VW * cs + 16) * limitU - 8} y2={cy(BOTTOM_LIMIT)} stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 4" />
            <Txt x={cx(0) - 12} y={cy(BOTTOM_LIMIT) + 4} anchor="end" text="bottom limit" color={colors.WARM} opacity={limitU} />
          </g>
        )}
        {arrowsU > 0.01 &&
          OVERSHOOTS.map((o, k) => {
            const r = GEO_S4[o.slot];
            const ax = cx(r[0] + r[2]) - 18 - k * 0;
            return (
              <g key={o.slot} opacity={arrowsU * (1 - morphU)}>
                <Arrow x1={ax + [0, -40, -80][k]} y1={cy(BOTTOM_LIMIT)} x2={ax + [0, -40, -80][k]} y2={cy(r[1] + r[3])} color={colors.NEGATIVE} w={2} />
                <Txt x={cx(0) - 12} y={cy(BOTTOM_LIMIT) + 30 + k * 18} anchor="end" text={`slot ${o.slot}: +${Math.round(o.over)} px`} color={colors.NEGATIVE} mono />
              </g>
            );
          })}
        {edgeU > 0.01 && (
          <g opacity={edgeU * (1 - morphU)}>
            <rect x={cx(S4.paddingX + S4.innerWidth)} y={cy(0)} width={Math.max(2, WRAP_MARGIN * cs)} height={VH * cs} fill={colors.TEAL} opacity={0.9} />
            <line x1={cx(RIGHT_LIMIT)} y1={cy(0) - 6} x2={cx(RIGHT_LIMIT)} y2={cy(VH) + 6} stroke={colors.TEAL} strokeWidth={1.5} />
          </g>
        )}

        {/* B3: the cursor, a forbidden step back */}
        {cursorU > 0.001 && (
          <g opacity={1 - shrinkU}>
            <line x1={cx(cursorGX)} y1={cy(0) + 2} x2={cx(cursorGX)} y2={cy(row1Bottom) + 8} stroke={colors.TEAL} strokeWidth={2.5} />
            <polygon points={`${cx(cursorGX) - 6},${cy(row1Bottom) + 16} ${cx(cursorGX) + 6},${cy(row1Bottom) + 16} ${cx(cursorGX)},${cy(row1Bottom) + 8}`} fill={colors.TEAL} />
            <Txt x={cx(cursorGX) + 8} y={cy(row1Bottom) + 22} text="cursor →" color={colors.TEAL} mono opacity={clamp01(cursorU * 6)} />
          </g>
        )}
        {ghostU > 0.01 && (() => {
          const gh = GEO_S7[2];
          const back = GEO_S7[12][0] + 40;
          const gx0 = cx(back);
          const gy0 = cy(gh[1]) + 1;
          return (
            <g opacity={ghostU * (1 - shrinkU)}>
              <rect x={gx0} y={gy0} width={gh[2] * cs} height={gh[3] * cs} rx={2} fill="none" stroke={colors.NEGATIVE} strokeDasharray="4 3" strokeWidth={1.5} />
              <line x1={gx0 + 8} y1={gy0 + 8} x2={gx0 + gh[2] * cs - 8} y2={gy0 + gh[3] * cs - 8} stroke={colors.NEGATIVE} strokeWidth={2.5} />
              <line x1={gx0 + gh[2] * cs - 8} y1={gy0 + 8} x2={gx0 + 8} y2={gy0 + gh[3] * cs - 8} stroke={colors.NEGATIVE} strokeWidth={2.5} />
            </g>
          );
        })()}
        <Chip x={cx(30)} y={cy(612)} text={`overlap: 0 in ${commas(SAMPLE_COUNT)} samples`} color={colors.POSITIVE} fs={14} opacity={counterU * (1 - shrinkU)} />
        <Chip x={cx(30)} y={cy(712)} text="only a crafted triple of keys within 2⁻³⁶ stacks slots" color={colors.MUTED} opacity={tripleU * (1 - shrinkU)} />
        <Chip x={cx(560)} y={cy(520)} text="span = raw − relu(raw − 1) ≤ 1" color={colors.TEAL} mono opacity={clamp01(cursorU * 3) * (1 - g('shrinkU'))} />

        {/* the two output lights */}
        {g('light1U') > 0.01 && lightsOp > 0.01 && (
          <g opacity={lightsOp}>
            <rect x={LIGHTS.x} y={LIGHTS.y} width={LIGHTS.w} height={LIGHTS.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} opacity={g('light1U')} />
            <g opacity={g('light1U')}>
              <Txt x={LIGHTS.x + 16} y={LIGHTS.y + 30} text="validBit" mono fs={14} />
              <circle cx={LIGHTS.x + LIGHTS.w - 34} cy={LIGHTS.y + 25} r={13} fill={isValid ? colors.POSITIVE : 'none'} stroke={isValid ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={2.2} />
              <text x={LIGHTS.x + LIGHTS.w - 34} y={LIGHTS.y + 30} textAnchor="middle" fill={isValid ? '#0a0e1a' : colors.NEGATIVE} fontSize={14} fontFamily={MONO} fontWeight={700}>
                {isValid ? 1 : 0}
              </text>
              <Txt x={LIGHTS.x + 16} y={LIGHTS.y + 50} text="exactly 0 or 1" color={colors.MUTED} />
            </g>
            <g opacity={g('light2U')}>
              <line x1={LIGHTS.x + 12} y1={LIGHTS.y + 64} x2={LIGHTS.x + LIGHTS.w - 12} y2={LIGHTS.y + 64} stroke={colors.GRID} />
              <Txt x={LIGHTS.x + 16} y={LIGHTS.y + 92} text="violationDepth" mono fs={14} />
              <Txt x={LIGHTS.x + LIGHTS.w - 16} y={LIGHTS.y + 92} anchor="end" text={isValid ? '0 px' : `${S4.depth.toFixed(1)} px`} mono fs={14} color={isValid ? colors.POSITIVE : colors.NEGATIVE} />
              <Txt x={LIGHTS.x + 16} y={LIGHTS.y + 113} text="how badly the rules break" color={colors.MUTED} />
            </g>
          </g>
        )}

        {/* the three rules */}
        {rulesU > 0.01 && rulesOp > 0.01 && (
          <g opacity={rulesOp}>
            {[
              { t: 'overlap · 120 visible pairs', sub: '' },
              { t: 'containment · bottom and right edges', sub: `right edge + ${WRAP_MARGIN.toFixed(1)} px wrap margin` },
              { t: 'minimum size · 48 × 32 px', sub: '' },
            ].map((r, k) => {
              const u = clamp01(rulesU - k);
              const spot = k === 1 ? contSpot : 0;
              const dim = k !== 1 ? 1 - 0.75 * contSpot : 1;
              const y = RULES.y + k * 44 + (k === 2 ? 14 : 0);
              return (
                <g key={k} opacity={u * dim} transform={`translate(${(1 - u) * 16} 0)`}>
                  <rect x={RULES.x} y={y} width={300} height={k === 1 ? 52 : 32} rx={7} fill={colors.PANEL} stroke={spot > 0.01 ? colors.WARM : colors.GRID} strokeWidth={1 + spot} />
                  <Txt x={RULES.x + 14} y={y + 21} text={r.t} fs={14} />
                  {r.sub && <Txt x={RULES.x + 14} y={y + 42} text={r.sub} color={colors.TEAL} opacity={edgeU > 0.01 ? edgeU : 0} />}
                </g>
              );
            })}
            <Chip x={RULES.x} y={RULES.y + 176} text="violationSlackPixels = 0.5" color={colors.WARM} mono opacity={slackU} />
            <Txt x={RULES.x} y={RULES.y + 200} text="a check's bit fires only past half a pixel" color={colors.MUTED} opacity={slackU} />
          </g>
        )}

        {/* ======================== the search field ======================== */}
        {fieldOp > 0.005 && (
          <g opacity={fieldOp}>
            <Txt x={FX0} y={FY0 - 16} text="search" fs={17} weight={600} opacity={g('searchLblU')} />
            <Txt x={FX0 + 66} y={FY0 - 16} text="sampleCount: 4000 · seed: 0x5EED · one dot per field vector" mono color={colors.MUTED} opacity={g('searchLblU')} />
            {/* filling in waves (sample order) */}
            {litU < 0.999 &&
              ROW_PATHS.map((d, r) => {
                const u = clamp01(fillU * (ROWS + 2) - r);
                if (u <= 0.01) return null;
                return <path key={r} d={d} fill={colors.MUTED} opacity={u * 0.55 * (1 - litU)} />;
              })}
            {litU > 0.001 && (
              <>
                <path d={PATH_CONTAIN} fill={colors.NEGATIVE} opacity={litU * lerp(0.3, 0.85, spotC) * (1 - 0.6 * flyU)} />
                <path d={PATH_SIZE} fill={colors.SECONDARY} opacity={litU * 0.9 * (1 - 0.6 * flyU)} />
                {flyU < 0.999 && <path d={PATH_VALID} fill={colors.POSITIVE} opacity={litU * lerp(1, 0.3, spotC) * (flyU > 0.001 ? 0.12 : 1)} />}
              </>
            )}
            <Txt x={FX0} y={498} text={`valid ${commas(VALID)} (${VALID_PCT}%)`} color={colors.POSITIVE} fs={16} weight={600} opacity={g('validCntU') * (1 - 0.7 * spotC)} />
            <g opacity={g('catCntU')}>
              <Txt x={FX0} y={522} text="overlap 0 ·" fs={14} color={colors.MUTED} />
              <Txt x={FX0 + 80} y={522} text={`containment ${commas(CONTAIN)}`} fs={14} color={colors.NEGATIVE} weight={600} />
              <Txt x={FX0 + 228} y={522} text={`· minimum size ${SIZE}`} fs={14} color={colors.SECONDARY} />
              <Txt x={FX0} y={540} text="containment: spilling past the bottom" color={colors.MUTED} />
            </g>
            {/* the weight bar */}
            {weightU > 0.01 && (
              <g opacity={weightU} transform={`translate(${(1 - weightU) * -40} 0)`}>
                {(() => {
                  const W = 7 * 77.7;
                  let x = FX0;
                  return WEIGHTS.map((w, k) => {
                    const ww = w.w * W;
                    const x0 = x;
                    x += ww;
                    const above = k === 0 || k === 2 || k === 4 || k === 6;
                    const col = [colors.ACCENT, colors.TEAL, colors.WARM, colors.SECONDARY, colors.POSITIVE, colors.MUTED, colors.NEGATIVE][k];
                    return (
                      <g key={w.name}>
                        <rect x={x0} y={548} width={ww - 2} height={14} rx={3} fill={col} opacity={0.75} />
                        <Txt x={x0 + ww / 2} y={above ? 524 : 594} anchor="middle" text={w.name} color={col} />
                        <Txt x={x0 + ww / 2} y={above ? 541 : 577} anchor="middle" text={String(w.w)} color={col} mono />
                      </g>
                    );
                  });
                })()}
              </g>
            )}
          </g>
        )}
        {/* valid dots in flight / in the histogram */}
        {flyU > 0.001 && <path d={flyPath} fill={colors.POSITIVE} opacity={histOp * (0.85 + 0.15 * (1 - focusU))} />}

        {/* ======================== the score chart ======================== */}
        {chartU > 0.01 && (
          <g opacity={chartOp}>
            <line x1={AX} y1={sy(SY0) + 6} x2={AX} y2={sy(SY0) + 6 - (sy(SY0) - sy(1) + 12) * chartU} stroke={colors.MUTED} strokeWidth={1.5} />
            {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((v, k) => (
              <g key={v} opacity={clamp01(chartU * 8 - k)}>
                <line x1={AX - 5} y1={sy(v)} x2={AX} y2={sy(v)} stroke={colors.MUTED} />
                <Txt x={AX - 9} y={sy(v) + 4} anchor="end" text={v.toFixed(1)} color={colors.MUTED} mono />
              </g>
            ))}
            <Txt x={AX} y={sy(1) - 18} text="fitness" color={colors.MUTED} opacity={chartU} />
            <g opacity={g('floorU')}>
              <line x1={AX} y1={FLOOR_Y} x2={TX1} y2={FLOOR_Y} stroke={colors.NEGATIVE} strokeDasharray="5 4" strokeWidth={1.5} />
              <Txt x={AX - 9} y={FLOOR_Y + 4} anchor="end" text="invalid" color={colors.NEGATIVE} />
              <Txt x={AX + 10} y={FLOOR_Y + 22} text={`${commas(INVALID)} invalid score −1 − min(1, depth/1000): below every valid`} color={colors.NEGATIVE} />
            </g>
            {/* B8: the step axis and the floor for climbs that start invalid */}
            {stepAxisU > 0.01 && (
              <g>
                <line x1={TX0} y1={sy(SY0) + 6} x2={lerp(TX0, TX1, stepAxisU)} y2={sy(SY0) + 6} stroke={colors.MUTED} strokeWidth={1.5} />
                {[0, 50, 100, 150].map((st, k) => (
                  <g key={st} opacity={clamp01(stepAxisU * 4 - k)}>
                    <line x1={tx(st)} y1={sy(SY0) + 6} x2={tx(st)} y2={sy(SY0) + 12} stroke={colors.MUTED} />
                    <Txt x={tx(st)} y={sy(SY0) + 26} anchor="middle" text={String(st)} color={colors.MUTED} mono />
                  </g>
                ))}
                <Txt x={TX1 + 10} y={sy(SY0) + 26} text="step" color={colors.MUTED} opacity={stepAxisU} />
                <line x1={TX0} y1={FLOOR_Y} x2={TX1} y2={FLOOR_Y} stroke={colors.NEGATIVE} strokeDasharray="5 4" strokeWidth={1.2} opacity={stepAxisU * 0.7} />
                <Txt x={AX - 9} y={FLOOR_Y + 4} anchor="end" text="invalid" color={colors.NEGATIVE} opacity={stepAxisU} />
              </g>
            )}
            {/* the search line at 0.875 */}
            {g('lineU') > 0.01 && (
              <g>
                <line x1={AX} y1={sy(0.875)} x2={lerp(AX, TX1, g('lineU'))} y2={sy(0.875)} stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="2 4" strokeLinecap="round" />
                <Txt x={AX - 9} y={sy(0.875) + 18} anchor="end" text="search 0.875" color={colors.WARM} mono opacity={clamp01(stepAxisU * 2)} />
              </g>
            )}
            <g opacity={g('topLblU')}>
              <Txt x={AX + 12} y={sy(0.875) - 12} text={`search top ${(FIT_MAX / 1000).toFixed(3)} (sample ${SEARCH_BEST}, visible ${VIS_SEARCH})`} color={colors.WARM} mono fs={14} />
            </g>
            {g('topU') > 0.01 && (
              <circle cx={TOP_XY[0]} cy={TOP_XY[1]} r={4 + 6 * g('topU')} fill="none" stroke={colors.WARM} strokeWidth={2.2} opacity={g('topU')} />
            )}

            {/* the twelve climbs */}
            {startsU > 0.01 &&
              TRAIL_XY.map((pts, k) => {
                const isBest = k === BEST_TRAIL;
                const op = isBest ? 1 : 1 - 0.88 * focusU;
                const su = clamp01(startsU * 1.5 - k / 24);
                const tip = Math.max(0, Math.min(STEPS, sweepU));
                const ix = Math.floor(tip);
                const tipY = pts[ix][1];
                const tipX = tx(tip);
                return (
                  <g key={k} opacity={op}>
                    {sweepU > 0.001 && (
                      <path d={trailPath(pts, sweepU)} fill="none" stroke={isBest && focusU > 0.01 ? colors.TEAL : colors.ACCENT} strokeWidth={isBest ? 1.6 + 1.2 * focusU : 1.4} opacity={0.85} />
                    )}
                    <circle cx={tipX} cy={tipY} r={3.4 * su} fill={tipY >= FLOOR_Y ? colors.NEGATIVE : sweepU >= STEPS - 0.01 ? colors.POSITIVE : colors.ACCENT} />
                  </g>
                );
              })}
            <g opacity={endsU}>
              {[
                { v: BEST, l: 'best' },
                { v: MEDIAN, l: 'median' },
                { v: WORST, l: 'worst' },
              ].map((m) => (
                <Txt key={m.l} x={TX1 + 12} y={sy(m.v) + 4} text={`${m.v.toFixed(3)} ${m.l}`} color={m.l === 'best' ? colors.TEAL : colors.TEXT} mono />
              ))}
            </g>
            <Chip x={960} y={470} text={`ended valid: ${ENDED_VALID}/${START_COUNT}`} color={colors.POSITIVE} mono opacity={g('validChipU')} />
            <g opacity={g('julyU')}>
              <Txt x={960} y={500} text="README (July): 0.922 / 0.887 / 0.865" color={colors.MUTED} mono />
              <line x1={958} y1={496} x2={960 + 36 * CH13 + 2} y2={496} stroke={colors.MUTED} strokeWidth={1.2} />
              <Txt x={960} y={520} text="not this run, and not pinned by the test" color={colors.MUTED} />
            </g>
          </g>
        )}

        {/* B7: the search winner's layout */}
        <LayoutCard a={GEO_SEARCH} x={CARD_SEARCH_B7.x} y={CARD_SEARCH_B7.y} s={CARD_SEARCH_B7.s} opacity={g('scardU')} nums={false} />
        {g('scardU') > 0.01 && (
          <g opacity={g('scardU')}>
            <Arrow x1={TOP_XY[0] + 12} y1={TOP_XY[1] + 8} x2={CARD_SEARCH_B7.x - 6} y2={CARD_SEARCH_B7.y + 30} color={colors.WARM} />
            <Txt x={CARD_SEARCH_B7.x} y={CARD_SEARCH_B7.y + VH * CARD_SEARCH_B7.s + 20} text={`sample ${SEARCH_BEST} · ${VIS_SEARCH} of 16 visible`} color={colors.WARM} mono />
          </g>
        )}
        <g opacity={g('timeU')}>
          <Txt x={CARD_SEARCH_B7.x} y={CARD_SEARCH_B7.y + VH * CARD_SEARCH_B7.s + 44} text="4000 samples in about ¼ s" fs={14} />
          <Txt x={CARD_SEARCH_B7.x} y={CARD_SEARCH_B7.y + VH * CARD_SEARCH_B7.s + 64} text="this machine, one run" color={colors.MUTED} />
        </g>

        {/* B8: the loss and the configuration */}
        {g('lossU') > 0.01 && g('lossOp') > 0.01 && (
          <g opacity={g('lossOp')}>
            <MathLabel tex={'\\text{loss} = -\\,\\text{fitness} + 0.002\\cdot\\text{violationDepth}'} x={FX0} y={170} anchor="start" fontSize={23} opacity={g('lossU')} />
            <Txt x={FX0} y={236} text="startCount: 12 · steps: 150 · learningRate: 0.02 · Adam" mono color={colors.MUTED} opacity={g('cfgU')} />
            <Txt x={FX0} y={258} text="twelve seeded random starts (0xBEEF); each trail is its best score so far" color={colors.MUTED} opacity={g('cfgU')} />
          </g>
        )}

        {/* B9: a decision bit and its fake slope (schematic) */}
        {g('steU') > 0.01 && g('steOp') > 0.01 && (
          <g opacity={g('steU') * g('steOp')}>
            <rect x={FX0} y={300} width={540} height={290} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <Txt x={FX0 + 18} y={326} text="a decision bit (schematic)" fs={14} />
            {/* axes */}
            <line x1={110} y1={520} x2={340} y2={520} stroke={colors.MUTED} />
            <line x1={110} y1={520} x2={110} y2={350} stroke={colors.MUTED} />
            <Txt x={340} y={540} anchor="end" text="input" color={colors.MUTED} />
            <Txt x={102} y={524} anchor="end" text="0" color={colors.MUTED} mono />
            <Txt x={102} y={384} anchor="end" text="1" color={colors.MUTED} mono />
            {/* forward: the exact step */}
            {(() => {
              const u = g('stepPlotU');
              const d = `M110,520 H225 V380 H340`;
              return <path d={d} fill="none" stroke={colors.WARM} strokeWidth={3} strokeDasharray="460" strokeDashoffset={460 * (1 - u)} />;
            })()}
            <Txt x={244} y={498} text="backward" color={colors.TEAL} opacity={g('slopeU')} />
            <Txt x={232} y={372} text="forward: exact" color={colors.WARM} opacity={g('stepPlotU')} />
            <Txt x={130} y={506} text="slope 0" color={colors.MUTED} opacity={g('stepPlotU')} />
            {/* backward: identity */}
            <line x1={lerp(150, 150, 1)} y1={520} x2={lerp(150, 300, g('slopeU'))} y2={lerp(520, 370, g('slopeU'))} stroke={colors.TEAL} strokeWidth={2.4} strokeDasharray="7 5" opacity={g('slopeU') > 0.01 ? 1 : 0} />
            <MathLabel tex={'\\partial\\,\\text{bit}/\\partial x := 1'} x={240} y={462} anchor="start" fontSize={19} color={colors.TEAL} opacity={g('slopeU')} />
            <Chip x={FX0 + 18} y={576} text="backpropagateStraightThrough" color={colors.TEAL} mono opacity={g('badgeU')} />
            <Txt x={FX0 + 268} y={576} text="straight-through" color={colors.TEAL} fs={15} weight={600} opacity={g('badgeU')} />
          </g>
        )}

        {/* B10: 173 vs 120 */}
        {g('gaugeU') > 0.01 && g('steOp') > 0.01 && (
          <g opacity={g('gaugeU') * g('steOp')}>
            <line x1={386} y1={340} x2={386} y2={560} stroke={colors.GRID} />
            <Txt x={400} y={360} text="hero importance probe" fs={14} />
            <Txt x={400} y={392} text="straight-through 173" color={colors.NEGATIVE} mono />
            <rect x={400} y={400} width={173 * 1.15 * g('bar1U')} height={16} rx={3} fill={colors.NEGATIVE} opacity={0.8} />
            <Txt x={400} y={446} text="true local slope 120" color={colors.POSITIVE} mono />
            <rect x={400} y={454} width={120 * 1.15 * g('bar2U')} height={16} rx={3} fill={colors.POSITIVE} opacity={0.8} />
            <g opacity={g('phantomU')}>
              <rect x={400 + 120 * 1.15} y={400} width={53 * 1.15} height={16} rx={3} fill="none" stroke={colors.TEXT} strokeDasharray="3 3" />
              <Txt x={400} y={500} text="+53 phantom gradient" color={colors.TEXT} fs={14} />
              <Txt x={400} y={520} text="magnitudes are not derivatives" color={colors.MUTED} />
            </g>
          </g>
        )}

        {/* B12: the best climb's layout, and the two-slab layout */}
        {ascU > 0.01 && (
          <g opacity={ascU}>
            <LayoutCard a={GEO_ASCENT} x={ascPos.x} y={ascPos.y} s={ascPos.s} nums={pairU < 0.2} />
            <Txt x={ascPos.x} y={ascPos.y + VH * ascPos.s + 20} text={pairU < 0.5 ? `best climb ${BEST.toFixed(3)} · ${VIS_ASCENT} of 16 visible` : `gradient · ${BEST.toFixed(3)} · ${VIS_ASCENT} visible`} color={colors.TEAL} mono fs={pairU < 0.5 ? 14 : 13} />
          </g>
        )}
        {slabU > 0.01 && (
          <g opacity={slabU}>
            <rect x={CARD_SLAB.x - 8} y={CARD_SLAB.y - 8} width={VW * CARD_SLAB.s + 16} height={VH * CARD_SLAB.s + 16} rx={8} fill="none" stroke={colors.GRID} strokeDasharray="4 4" />
            <LayoutCard a={GEO_SLAB} x={CARD_SLAB.x} y={CARD_SLAB.y} s={CARD_SLAB.s} nums={false} />
            <Txt x={CARD_SLAB.x + VW * CARD_SLAB.s + 22} y={CARD_SLAB.y + 30} text="without richness term: 1.000" color={colors.WARM} mono fs={14} />
            <Txt x={CARD_SLAB.x + VW * CARD_SLAB.s + 22} y={CARD_SLAB.y + 52} text="two visible slots · a hand-built test layout" color={colors.MUTED} />
          </g>
        )}

        {/* B13: the richness cap, the two layouts, the verdict */}
        {pairU > 0.01 && (
          <g opacity={pairU}>
            <LayoutCard a={GEO_SEARCH} x={CARD_PAIR_L.x} y={CARD_PAIR_L.y} s={CARD_PAIR_L.s} nums={false} />
            <Txt x={CARD_PAIR_L.x} y={CARD_PAIR_L.y + VH * CARD_PAIR_L.s + 20} text={`search · 0.875 · ${VIS_SEARCH} visible`} color={colors.WARM} mono />
          </g>
        )}
        {richU > 0.01 && (
          <g opacity={clamp01(richU * 2)}>
            <MathLabel tex={'\\text{contentRichness} = \\min(1,\\ \\text{visibleCount}/10)'} x={RP.x0 - 10} y={112} anchor="start" fontSize={19} opacity={richU} />
            <line x1={RP.x0} y1={RP.y0} x2={RP.x1} y2={RP.y0} stroke={colors.MUTED} />
            <line x1={RP.x0} y1={RP.y0} x2={RP.x0} y2={RP.y1 - 10} stroke={colors.MUTED} />
            <Txt x={RP.x0 - 8} y={rpy(1) + 4} anchor="end" text="1" color={colors.MUTED} mono />
            <Txt x={RP.x0 - 8} y={RP.y0 + 4} anchor="end" text="0" color={colors.MUTED} mono />
            {[0, 10, 16].map((n) => (
              <Txt key={n} x={rpx(n)} y={RP.y0 + 18} anchor="middle" text={String(n)} color={colors.MUTED} mono />
            ))}
            <Txt x={RP.x1} y={RP.y0 + 36} anchor="end" text="visible slots" color={colors.MUTED} />
            <path d={`M${rpx(0)},${rpy(0)} L${rpx(lerp(0, 10, clamp01(richU * 1.6)))},${rpy(RICH(lerp(0, 10, clamp01(richU * 1.6))))} ${richU > 0.62 ? `L${rpx(lerp(10, 16, clamp01((richU - 0.62) / 0.38)))},${rpy(1)}` : ''}`}
              fill="none" stroke={colors.TEXT} strokeWidth={2} />
            <line x1={rpx(10)} y1={RP.y0} x2={rpx(10)} y2={rpy(1)} stroke={colors.MUTED} strokeDasharray="3 3" />
            <g opacity={clamp01((richU - 0.6) / 0.4)}>
              <circle cx={rpx(VIS_ASCENT)} cy={rpy(RICH(VIS_ASCENT))} r={5} fill={colors.TEAL} />
              <Txt x={rpx(VIS_ASCENT) + 10} y={rpy(RICH(VIS_ASCENT)) + 16} text={`6 → ${(RICH_W * RICH(VIS_ASCENT)).toFixed(3)}`} color={colors.TEAL} mono />
              <circle cx={rpx(VIS_SEARCH)} cy={rpy(RICH(VIS_SEARCH))} r={5} fill={colors.WARM} />
              <Txt x={rpx(VIS_SEARCH) - 10} y={rpy(RICH(VIS_SEARCH)) - 10} anchor="end" text={`9 → ${(RICH_W * RICH(VIS_SEARCH)).toFixed(3)}`} color={colors.WARM} mono />
              <Txt x={rpx(10) + 8} y={rpy(1) + 16} text="cap at 10" color={colors.MUTED} />
            </g>
            <Txt x={RP.x1 + 30} y={rpy(0.55)} text="weighted × 0.15" color={colors.MUTED} opacity={clamp01((richU - 0.6) / 0.4)} />
          </g>
        )}
        {arrowU > 0.01 && (
          <g opacity={arrowU}>
            {[
              { card: CARD_PAIR_L, label: 'search', color: colors.WARM },
              { card: CARD_PAIR_R, label: 'gradient', color: colors.TEAL },
            ].map(({ card, label, color }) => {
              const mx = card.x + (VW * card.s) / 2;
              return (
                <g key={label}>
                  <Txt x={mx} y={card.y - 36} anchor="middle" text={label} color={color} fs={15} weight={600} />
                  <Arrow x1={mx} y1={card.y - 30} x2={mx} y2={card.y - 6} color={color} w={2} />
                </g>
              );
            })}
          </g>
        )}
        <Txt x={CARD_PAIR_L.x} y={CARD_PAIR_L.y + VH * CARD_PAIR_L.s + 54} text="same number, different taste" color={colors.TEXT} fs={19} weight={600} opacity={tasteU} />
        {finalU > 0.01 && (
          <g opacity={finalU}>
            <rect x={740} y={402} width={470} height={96} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <Txt x={975} y={440} anchor="middle" text="the fitness function is the bottleneck" fs={20} weight={600} color={colors.WARM} />
            <Txt x={975} y={472} anchor="middle" text="one program scores itself · two optimizers · one number" color={colors.MUTED} fs={14} />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={32} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        2 · Scored, Searched, Climbed
      </text>
    </>
  );
}

export const vizScene = () => scene;
