import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';
function Chapter4() { const sc = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={sc.tl} loop>{(s) => <Render s={s} />}</Player></div>; }
const meta: Meta<typeof Chapter4> = { title: 'Books/The Anchor Test/Chapter 4', component: Chapter4 };
export default meta;
export const Scene: StoryObj<typeof Chapter4> = {};
