import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';
function Chapter2() { const scene = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={scene.tl} loop>{(s) => <Render s={s} />}</Player></div>; }
const meta: Meta<typeof Chapter2> = { title: 'Books/Skip the Giant Model/Chapter 2', component: Chapter2 };
export default meta;
export const Scene: StoryObj<typeof Chapter2> = {};
