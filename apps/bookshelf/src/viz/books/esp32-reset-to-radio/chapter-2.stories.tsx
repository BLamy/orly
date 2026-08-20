import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core'; import { Render, vizScene } from './chapter-2';
function Chapter2() { const s = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={s.tl} loop>{(frame) => <Render s={frame} />}</Player></div>; }
const meta: Meta<typeof Chapter2> = { title: 'Books/From Reset to Radio/Chapter 2', component: Chapter2 }; export default meta; export const Scene: StoryObj<typeof Chapter2> = {};
