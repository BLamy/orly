// Shared vocabulary for the series "From RLCD to Predictive Tab" — NOT a scene
// module (it lives in a subdirectory so the books/*/*.tsx scene glob skips it).
//
// The recurring fictional Profile page, the explicit task, and the three focus
// conventions every book in the series reuses:
//   · actual keyboard focus  → FocusRing     (SOLID ring, light + cyan glow)
//   · predicted target       → SuggestHalo   (DASHED violet halo, offset wider)
//   · click / activation     → Activation    (expanding cyan ripple + crosshair)
// A suggestion never implies focus, and focus never implies activation: they
// are three separate components, each driven by its own sampled channel.
//
// Everything is a pure function of its props. No clocks, no randomness.
//
// PAGE GEOMETRY (page-local units, origin = window top-left, 560 × 440):
//   chrome bar      y 0–36     url pill "account.example/profile", obs badge
//   nav bar         y 36–84    brand "Acme Account"; Profile menu button
//   heading         y 122      "Profile"
//   Display name    field  x 32  y 178  w 336  h 40   (label at y 170)
//   Email           field  x 32  y 254  w 336  h 40   (label at y 246)
//   Save            button x 32  y 326  w 112  h 40   (disabled until edited)
//   Sign out        link   x 444 y 334  w 88   h 26
//   Profile menu    button x 420 y 46   w 118  h 30
//   saved toast     x 32 y 384 w 300 h 34
// Use controlRect(id, placement) to get stage coordinates for any placement.
import { colors } from '../../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const MONO = colors.font.mono;

/** Series colour roles. Colour never carries meaning alone — pair with a label/shape. */
export const ROLE = {
  OBSERVE: '#38bdf8', // cyan — live observation, browser targets
  MODEL: '#a78bfa', // violet — model computation, context state, suggestions
  CHECKED: '#34d399', // green — checked outcomes, supported decisions
  PENDING: '#fbbf24', // amber — uncertainty, pending checks, explicit fallback
  INVALID: '#fb7185', // coral — invalid / stale choices, failed outcomes
} as const;

export const TASK_TEXT = 'Change my display name to Brett';
export const NAME_BEFORE = 'brettl42';
export const NAME_AFTER = 'Brett';
export const EMAIL_VALUE = 'brett@example.test';

export const PAGE = { w: 560, h: 440 } as const;

export type ControlId =
  | 'profile-menu'
  | 'display-name-field'
  | 'email-field'
  | 'save-button'
  | 'sign-out-link';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ControlSpec extends Rect {
  rx: number;
  role: 'button' | 'textbox' | 'link';
  name: string;
}

export const CONTROLS: Record<ControlId, ControlSpec> = {
  'profile-menu': { x: 420, y: 46, w: 118, h: 30, rx: 15, role: 'button', name: 'Profile menu' },
  'display-name-field': { x: 32, y: 178, w: 336, h: 40, rx: 8, role: 'textbox', name: 'Display name' },
  'email-field': { x: 32, y: 254, w: 336, h: 40, rx: 8, role: 'textbox', name: 'Email' },
  'save-button': { x: 32, y: 326, w: 112, h: 40, rx: 8, role: 'button', name: 'Save' },
  'sign-out-link': { x: 444, y: 334, w: 88, h: 26, rx: 6, role: 'link', name: 'Sign out' },
};

export const CONTROL_IDS = Object.keys(CONTROLS) as ControlId[];

export interface PagePlacement {
  x: number;
  y: number;
  scale: number;
}

/** A control's rectangle in stage coordinates for a given page placement. */
export function controlRect(id: ControlId, p: PagePlacement): Rect {
  const c = CONTROLS[id];
  return { x: p.x + c.x * p.scale, y: p.y + c.y * p.scale, w: c.w * p.scale, h: c.h * p.scale };
}

export function rectCenter(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export interface ControlMark {
  id: ControlId;
  u: number;
  color: string;
  dashed?: boolean;
  tag?: string;
}

export interface ProfilePageProps {
  place: PagePlacement;
  opacity?: number;
  /** 0 = account home (skeleton), 1 = the Profile form. */
  formU?: number;
  /** 0 = original name, 0..1 = "Brett" being typed, 1 = "Brett". */
  typeU?: number;
  /** 0..1 saved toast. */
  savedU?: number;
  /** 0..1 Profile menu dropdown. */
  menuOpenU?: number;
  /** outlines drawn around controls (observation / eligibility marks). */
  marks?: ControlMark[];
  /** small badge in the chrome bar, e.g. "observation v12". */
  obsLabel?: string;
  obsU?: number;
}

/** The recurring fictional Profile page. */
export function ProfilePage({
  place,
  opacity = 1,
  formU = 1,
  typeU = 0,
  savedU = 0,
  menuOpenU = 0,
  marks,
  obsLabel,
  obsU = 1,
}: ProfilePageProps) {
  const o = clamp01(opacity);
  if (o <= 0.002) return null;
  const f = clamp01(formU);
  const ty = clamp01(typeU);
  const nChars = Math.ceil(ty * NAME_AFTER.length - 1e-6);
  const typing = ty > 0.001;
  const nameShown = typing ? NAME_AFTER.slice(0, nChars) : NAME_BEFORE;
  const caret = typing && ty < 0.999;
  const saveOn = clamp01((ty - 0.8) * 5) * (1 - clamp01(savedU));
  const name = CONTROLS['display-name-field'];
  const email = CONTROLS['email-field'];
  const save = CONTROLS['save-button'];
  const out = CONTROLS['sign-out-link'];
  const menu = CONTROLS['profile-menu'];
  return (
    <g transform={`translate(${place.x} ${place.y}) scale(${place.scale})`} opacity={o}>
      {/* window */}
      <rect width={PAGE.w} height={PAGE.h} rx={14} fill="#0f172a" stroke="#2a3754" strokeWidth={1.5} />
      <rect width={PAGE.w} height={36} rx={14} fill="#0a1120" />
      <rect y={18} width={PAGE.w} height={18} fill="#0a1120" />
      {[20, 38, 56].map((cx) => (
        <circle key={cx} cx={cx} cy={18} r={5} fill="#334155" />
      ))}
      <rect x={84} y={8} width={300} height={20} rx={10} fill="#111c33" />
      <text x={100} y={22} fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={f}>
        account.example/profile
      </text>
      <text x={100} y={22} fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={1 - f}>
        account.example/home
      </text>
      {obsLabel && (
        <g opacity={clamp01(obsU)}>
          <rect x={400} y={8} width={148} height={20} rx={10} fill="#082f49" stroke={ROLE.OBSERVE} strokeWidth={1} />
          <circle cx={412} cy={18} r={3.5} fill={ROLE.OBSERVE} />
          <text x={421} y={22} fill={ROLE.OBSERVE} fontSize={10.5} fontFamily={MONO}>
            {obsLabel}
          </text>
        </g>
      )}

      {/* nav */}
      <rect y={36} width={PAGE.w} height={48} fill="#0d1526" />
      <line x1={0} y1={84} x2={PAGE.w} y2={84} stroke="#1e2a44" />
      <text x={24} y={66} fill={colors.TEXT} fontSize={15} fontWeight={700}>
        Acme Account
      </text>
      <text x={134} y={66} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
        fictional demo
      </text>
      <rect x={menu.x} y={menu.y} width={menu.w} height={menu.h} rx={menu.rx} fill="#16213a" stroke="#31405f" />
      <circle cx={menu.x + 17} cy={menu.y + 15} r={9} fill="#334155" />
      <text x={menu.x + 17} y={menu.y + 19} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontWeight={700}>
        B
      </text>
      <text x={menu.x + 34} y={menu.y + 20} fill={colors.TEXT} fontSize={12.5}>
        Profile ▾
      </text>

      {/* account home skeleton (before the form is reached) */}
      {f < 0.998 && (
        <g opacity={1 - f}>
          <text x={32} y={122} fill={colors.TEXT} fontSize={24} fontWeight={750}>
            Account home
          </text>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={32} y={160 + i * 44} width={[330, 260, 300, 180][i]} height={22} rx={6} fill="#182238" />
          ))}
        </g>
      )}

      {/* the Profile form */}
      {f > 0.002 && (
        <g opacity={f}>
          <text x={32} y={122} fill={colors.TEXT} fontSize={24} fontWeight={750}>
            Profile
          </text>
          <text x={32} y={143} fill={colors.MUTED} fontSize={11}>
            Account settings
          </text>

          <text x={name.x} y={name.y - 8} fill={colors.MUTED} fontSize={12}>
            Display name
          </text>
          <rect x={name.x} y={name.y} width={name.w} height={name.h} rx={name.rx} fill="#0b1324" stroke="#31405f" strokeWidth={1.4} />
          <text x={name.x + 14} y={name.y + 26} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            {nameShown}
          </text>
          {caret && (
            <rect x={name.x + 15 + nChars * 9.05} y={name.y + 10} width={1.6} height={20} fill={colors.TEXT} />
          )}

          <text x={email.x} y={email.y - 8} fill={colors.MUTED} fontSize={12}>
            Email
          </text>
          <rect x={email.x} y={email.y} width={email.w} height={email.h} rx={email.rx} fill="#0b1324" stroke="#31405f" strokeWidth={1.4} />
          <text x={email.x + 14} y={email.y + 26} fill={colors.TEXT} fontSize={15} fontFamily={MONO} opacity={0.85}>
            {EMAIL_VALUE}
          </text>

          {/* Save: visibly disabled until the name has been edited */}
          <rect x={save.x} y={save.y} width={save.w} height={save.h} rx={save.rx} fill="#1a2438" stroke="#2c3a58" strokeDasharray="4 3" />
          <rect x={save.x} y={save.y} width={save.w} height={save.h} rx={save.rx} fill="#0369a1" stroke={ROLE.OBSERVE} opacity={saveOn} />
          <text x={save.x + save.w / 2} y={save.y + 25} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={650} opacity={0.4 + 0.6 * saveOn}>
            Save
          </text>

          <text x={out.x + out.w / 2} y={out.y + 18} textAnchor="middle" fill="#93c5fd" fontSize={13} textDecoration="underline">
            Sign out
          </text>

          {/* x 380–540 beside the fields is deliberately EMPTY: it is the reserved
              gutter where suggestion hints and keycaps appear across the series. */}

          {savedU > 0.002 && (
            <g opacity={clamp01(savedU)}>
              <rect x={32} y={384} width={300} height={34} rx={8} fill="#062a1e" stroke={ROLE.CHECKED} />
              <text x={46} y={406} fill={ROLE.CHECKED} fontSize={13}>
                ✓ Saved — display name is Brett
              </text>
            </g>
          )}
        </g>
      )}

      {/* Profile menu dropdown */}
      {menuOpenU > 0.002 && (
        <g opacity={clamp01(menuOpenU)} transform={`translate(0 ${(1 - clamp01(menuOpenU)) * -6})`}>
          <rect x={menu.x} y={82} width={menu.w} height={62} rx={8} fill="#16213a" stroke="#31405f" />
          <rect x={menu.x + 4} y={87} width={menu.w - 8} height={24} rx={5} fill="#22314f" />
          <text x={menu.x + 14} y={104} fill={colors.TEXT} fontSize={12.5}>
            Profile
          </text>
          <text x={menu.x + 14} y={132} fill={colors.MUTED} fontSize={12.5}>
            Settings
          </text>
        </g>
      )}

      {/* observation / eligibility outlines */}
      {marks?.map((m) => {
        const u = clamp01(m.u);
        if (u <= 0.002) return null;
        const c = CONTROLS[m.id];
        return (
          <g key={m.id} opacity={u}>
            <rect
              x={c.x - 5}
              y={c.y - 5}
              width={c.w + 10}
              height={c.h + 10}
              rx={c.rx + 4}
              fill="none"
              stroke={m.color}
              strokeWidth={1.8}
              strokeDasharray={m.dashed ? '5 4' : undefined}
            />
            {m.tag && (
              <text x={c.x - 3} y={c.y - 9} fill={m.color} fontSize={10} fontFamily={MONO}>
                {m.tag}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** ACTUAL keyboard focus — a SOLID ring. Stage coordinates. */
export function FocusRing({ rect, u, label }: { rect: Rect; u: number; label?: string }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const pad = 5;
  return (
    <g opacity={o}>
      <rect x={rect.x - pad} y={rect.y - pad} width={rect.w + pad * 2} height={rect.h + pad * 2} rx={11} fill="none" stroke={ROLE.OBSERVE} strokeWidth={7} opacity={0.3} />
      <rect x={rect.x - pad} y={rect.y - pad} width={rect.w + pad * 2} height={rect.h + pad * 2} rx={11} fill="none" stroke="#f1f5f9" strokeWidth={2.8} />
      {label && (
        <g transform={`translate(${rect.x - pad} ${rect.y + rect.h + pad + 6})`}>
          <rect width={label.length * 6.3 + 26} height={18} rx={9} fill="#0b1324" stroke="#f1f5f9" strokeWidth={1} />
          <rect x={7} y={5} width={9} height={8} rx={2} fill="none" stroke="#f1f5f9" strokeWidth={1.6} />
          <text x={21} y={13} fill="#f1f5f9" fontSize={10.5} fontFamily={MONO}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/** PREDICTED target — a DASHED violet halo, wider than the focus ring. `phase` is a sampled channel. */
export function SuggestHalo({ rect, u, phase = 0, label }: { rect: Rect; u: number; phase?: number; label?: string }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const pad = 12;
  const breathe = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
  return (
    <g opacity={o}>
      <rect x={rect.x - pad} y={rect.y - pad} width={rect.w + pad * 2} height={rect.h + pad * 2} rx={16} fill={ROLE.MODEL} opacity={0.05 + 0.06 * breathe} />
      <rect
        x={rect.x - pad}
        y={rect.y - pad}
        width={rect.w + pad * 2}
        height={rect.h + pad * 2}
        rx={16}
        fill="none"
        stroke={ROLE.MODEL}
        strokeWidth={2.4}
        strokeDasharray="9 7"
        strokeDashoffset={-phase * 32}
      />
      {label && (
        <g transform={`translate(${rect.x + rect.w + pad - (label.length * 6.3 + 26)} ${rect.y - pad - 22})`}>
          <rect width={label.length * 6.3 + 26} height={18} rx={9} fill="#1a1333" stroke={ROLE.MODEL} strokeWidth={1} />
          <circle cx={12} cy={9} r={4} fill="none" stroke={ROLE.MODEL} strokeWidth={1.5} strokeDasharray="2.5 2" />
          <text x={21} y={13} fill={ROLE.MODEL} fontSize={10.5} fontFamily={MONO}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/** CLICK / ACTIVATION — one expanding ripple, u 0→1. Separate from focus and suggestion. */
export function Activation({ x, y, u, label }: { x: number; y: number; u: number; label?: string }) {
  if (u <= 0.002 || u >= 0.998) return null;
  const a = 1 - u;
  return (
    <g>
      <circle cx={x} cy={y} r={6 + 40 * u} fill="none" stroke={ROLE.OBSERVE} strokeWidth={3} opacity={a} />
      <circle cx={x} cy={y} r={4 + 22 * u} fill="none" stroke="#f1f5f9" strokeWidth={2} opacity={a * 0.9} />
      <path d={`M${x - 9} ${y}H${x + 9}M${x} ${y - 9}V${y + 9}`} stroke="#f1f5f9" strokeWidth={2} opacity={a} />
      {label && (
        <text x={x + 16} y={y - 16} fill={ROLE.OBSERVE} fontSize={11} fontFamily={MONO} opacity={Math.min(1, a * 2)}>
          {label}
        </text>
      )}
    </g>
  );
}

/** The mouse pointer — its own object, never confused with focus. */
export function Pointer({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  const o = clamp01(opacity);
  if (o <= 0.002) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <path d="M0 0 L0 19 L5 14.5 L8.6 22.5 L11.8 21 L8.3 13.2 L14.5 13 Z" fill="#f8fafc" stroke="#0a0e1a" strokeWidth={1.4} strokeLinejoin="round" />
    </g>
  );
}

/** A keyboard keycap (e.g. Tab). `press` 0..1 depresses it. */
export function Keycap({ x, y, label, u, press = 0 }: { x: number; y: number; label: string; u: number; press?: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const w = label.length * 8 + 26;
  const p = clamp01(press);
  return (
    <g transform={`translate(${x} ${y + p * 3})`} opacity={o}>
      <rect y={4 - p * 3} width={w} height={26} rx={6} fill="#020617" />
      <rect width={w} height={26} rx={6} fill={p > 0.5 ? '#312e81' : '#1e293b'} stroke="#94a3b8" strokeWidth={1.3} />
      <text x={w / 2} y={17.5} textAnchor="middle" fill="#f1f5f9" fontSize={12} fontFamily={MONO} fontWeight={700}>
        {label}
      </text>
    </g>
  );
}

/** The explicit task, always quoted the same way. */
export function TaskChip({ x, y, w, u, note }: { x: number; y: number; w: number; u: number; note?: string }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <g transform={`translate(${x} ${y + (1 - o) * 8})`} opacity={o}>
      <rect width={w} height={52} rx={12} fill="#171335" stroke={ROLE.MODEL} strokeWidth={1.6} />
      <text x={16} y={20} fill={ROLE.MODEL} fontSize={10.5} fontFamily={MONO} letterSpacing={1}>
        {note ?? 'EXPLICIT TASK'}
      </text>
      <text x={16} y={40} fill={colors.TEXT} fontSize={15} fontWeight={600}>
        “{TASK_TEXT}”
      </text>
    </g>
  );
}

/** "PROPOSED" tag — the product vision is always labelled as such. */
export function ProposedTag({ x, y, u, text = 'PROPOSED' }: { x: number; y: number; u: number; text?: string }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const w = text.length * 7 + 18;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect width={w} height={18} rx={4} fill="none" stroke={ROLE.PENDING} strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={w / 2} y={13} textAnchor="middle" fill={ROLE.PENDING} fontSize={10} fontFamily={MONO} letterSpacing={1}>
        {text}
      </text>
    </g>
  );
}

/** Narration pacing: ~150 words/minute plus a breath. Pure function of the text. */
export function captionDur(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(5, Math.round((words / 2.5 + 1.1) * 10) / 10);
}

/** Lay captions end to end with a small gap; returns start times and durations. */
export function captionPlan(texts: readonly string[], start = 0.4, gap = 0.5): { at: number[]; dur: number[]; end: number } {
  const at: number[] = [];
  const dur: number[] = [];
  let t = start;
  for (const text of texts) {
    const d = captionDur(text);
    at.push(Math.round(t * 100) / 100);
    dur.push(d);
    t += d + gap;
  }
  return { at, dur, end: t };
}
