import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';
function Chapter1() { const sc = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={sc.tl} loop>{(s) => <Render s={s} />}</Player></div>; }
const meta: Meta<typeof Chapter1> = { title: 'Books/The Anchor Test/Chapter 1', component: Chapter1 };
export default meta;
export const Scene: StoryObj<typeof Chapter1> = {};
