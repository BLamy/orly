import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

function Chapter() {
  const sc = vizScene();
  return <div style={{ padding: '4vh 4vw' }}><Player timeline={sc.tl} loop>{(s) => <Render s={s} />}</Player></div>;
}

const meta: Meta<typeof Chapter> = { title: 'Books/The Oracle Rollout/Chapter 4', component: Chapter };
export default meta;
export const DecodeOnceUpdateFour: StoryObj<typeof Chapter> = {};
