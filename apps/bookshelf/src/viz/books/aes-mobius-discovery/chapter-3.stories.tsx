import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core'; import { Render, vizScene } from './chapter-3';
const scene = vizScene(); function Chapter(){return <div style={{padding:'4vh 4vw'}}><Player timeline={scene.tl} loop>{s=><Render s={s}/>}</Player></div>}
export default {title:'Books/Finding the Bridge/Chapter 3',component:Chapter} satisfies Meta<typeof Chapter>;
export const HonestDeadEnds: StoryObj<typeof Chapter> = {};
