import type { Meta, StoryObj } from '@storybook/react-vite'; import { Player } from '../../core'; import { Render, vizScene } from './chapter-4';
function Chapter4() { const s = vizScene(); return <div style={{ padding: '4vh 4vw' }}><Player timeline={s.tl} loop>{(frame) => <Render s={frame} />}</Player></div>; }
const meta: Meta<typeof Chapter4> = { title: 'Books/From Reset to Radio/Chapter 4', component: Chapter4 }; export default meta; export const Scene: StoryObj<typeof Chapter4> = {};
