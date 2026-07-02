import { createElement } from 'react';
import type { Preview } from '@storybook/react-vite';
import { MotionBridge } from '../src/viz/editor/bridge';
import 'katex/dist/katex.min.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  // relays every story's Player to the Motion addon panel
  decorators: [(story) => createElement(MotionBridge, null, story())],
};

export default preview;
