import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';
const scene = vizScene();
function Chapter() { return <div style={{padding:'4vh 4vw'}}><Player timeline={scene.tl} loop>{s=><Render s={s}/>}</Player></div>; }
export default {title:'Books/Recordings Become Practice/Chapter 1',component:Chapter} satisfies Meta<typeof Chapter>;
export const Default: StoryObj<typeof Chapter> = {};
