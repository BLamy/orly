// Integration wrapper by Codex; the chapter visualization is authored by Fable 5.1.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';
const scene = vizScene();
function Chapter1() {
  return <div style={{ padding: '4vh 4vw' }}><Player timeline={scene.tl} loop>{s => <Render s={s} />}</Player></div>;
}
const meta: Meta<typeof Chapter1> = { title: 'Books/One Read, Many Decisions/Chapter 1', component: Chapter1 };
export default meta;
export const Scene: StoryObj<typeof Chapter1> = {};
