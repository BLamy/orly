import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

function Chapter() {
  const sc = vizScene();
  return <div style={{ padding: '4vh 4vw' }}><Player timeline={sc.tl} loop>{(s) => <Render s={s} />}</Player></div>;
}

const meta: Meta<typeof Chapter> = { title: 'Books/The Work Ledger/Chapter 1', component: Chapter };
export default meta;
export const BoardOutsideConversation: StoryObj<typeof Chapter> = {};
