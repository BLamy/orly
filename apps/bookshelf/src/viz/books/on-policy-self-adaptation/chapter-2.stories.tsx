import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';
function Chapter() { const sc = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={sc.tl} loop>{(s) => <Render s={s} />}</Player></div>; }
const meta: Meta<typeof Chapter> = { title: 'Books/The Lowest Fifth/Chapter 2', component: Chapter };
export default meta;
export const ThePackedBatchSelector: StoryObj<typeof Chapter> = {};
