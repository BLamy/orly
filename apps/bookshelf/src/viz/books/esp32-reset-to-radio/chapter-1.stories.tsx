import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';
function Chapter1() { const s = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={s.tl} loop>{(frame) => <Render s={frame} />}</Player></div>; }
const meta: Meta<typeof Chapter1> = { title: 'Books/From Reset to Radio/Chapter 1', component: Chapter1 };
export default meta;
export const Scene: StoryObj<typeof Chapter1> = {};
