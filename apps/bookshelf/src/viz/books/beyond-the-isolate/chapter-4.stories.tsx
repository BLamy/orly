import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';
function Chapter() { const scene = vizScene(); return <div style={{padding:'4vh 4vw'}}><Player timeline={scene.tl} loop>{(s) => <Render s={s}/>}</Player></div>; }
const meta: Meta<typeof Chapter> = { title: 'Books/Beyond the Isolate/Chapter 4', component: Chapter };
export default meta;
export const Scene: StoryObj<typeof Chapter> = {};
