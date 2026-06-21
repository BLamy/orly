import type { Story } from '../types';
import type { Transcript } from '../engine/align';
import { almostnodeStory } from './almostnode';
import { appBuilderStory } from './app-builder';
import { codingAgentsStory } from './coding-agents';
import { keychainStory } from './keychain';
import { previewStory } from './preview';
import { tailscaleStory } from './tailscale';

import almostnodeTranscript from '../data/transcripts/almostnode.json';
import keychainTranscript from '../data/transcripts/keychain.json';
import agentsTranscript from '../data/transcripts/agents.json';
import previewTranscript from '../data/transcripts/preview.json';
import tailscaleTranscript from '../data/transcripts/tailscale.json';
import appBuildingTranscript from '../data/transcripts/app-building.json';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  blurb: string;
  /** accent color for the chapter card (a NodeKind-ish hue) */
  accent: string;
  story: Story;
  /** narration MP3 (served from /public); when set the chapter plays in audio mode */
  audio?: string;
  /** word-timestamp transcript used to sync step reveals to the narration */
  transcript?: Transcript;
  /** stop playback at this time (seconds) — used to trim a bad audio tail */
  audioEnd?: number;
}

export const chapters: Chapter[] = [
  {
    id: 'almostnode',
    number: 1,
    title: 'How almostnode works',
    blurb: 'A full Node.js dev environment — editor, npm, a live dev server, hot reload — running in one browser tab.',
    accent: '#34d399',
    story: almostnodeStory,
    audio: 'audio/1-almostnode.mp3',
    transcript: almostnodeTranscript as Transcript,
  },
  {
    id: 'keychain',
    number: 2,
    title: 'The keychain',
    blurb: 'How secrets enter as files, get encrypted into a passkey-locked vault, and reach every open sandbox.',
    accent: '#f5b942',
    story: keychainStory,
    audio: 'audio/2-keychain.mp3',
    transcript: keychainTranscript as Transcript,
  },
  {
    id: 'agents',
    number: 3,
    title: 'How the coding agents work',
    blurb: 'Codex (Rust→WASM) and opencode run as real CLI agents in the tab — editing files and running commands in a loop.',
    accent: '#2dd4bf',
    story: codingAgentsStory,
    audio: 'audio/3-agents.mp3',
    transcript: agentsTranscript as Transcript,
  },
  {
    id: 'preview',
    number: 4,
    title: 'Driving & recording the preview',
    blurb: 'Playwright drives the preview iframe, eruda streams DevTools data back, and rrweb yields a replayable recording.',
    accent: '#fb7185',
    story: previewStory,
    audio: 'audio/4-preview.mp3',
    transcript: previewTranscript as Transcript,
  },
  {
    id: 'tailscale',
    number: 5,
    title: 'How Tailscale works',
    blurb: 'Putting a browser tab on a private VPN — userspace WireGuard in WASM, tunneled over WebSocket to DERP.',
    accent: '#22d3ee',
    story: tailscaleStory,
    audio: 'audio/5-tailscale.mp3',
    transcript: tailscaleTranscript as Transcript,
  },
  {
    id: 'app-builder',
    number: 6,
    title: 'The app-builder & control plane',
    blurb: 'From a browser prompt to a real Fly machine with a provisioned Neon Postgres, tracked on a control-plane board.',
    accent: '#34d399',
    story: appBuilderStory,
    audio: 'audio/6-app-building.mp3',
    // the source MP3 derails into the agents script at ~68s — trim there until re-recorded
    audioEnd: 68,
    transcript: appBuildingTranscript as Transcript,
  },
];
