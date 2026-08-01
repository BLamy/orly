import 'ios-vibrator-pro-max';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTheme } from './shell/theme';
import { initVideoColor } from './shell/videoTheme';
import '@orly/mobile-ui/styles.css';
import './index.css';

initTheme();
// Before anything renders (and so before any lazily-imported scene module
// reads it) — the scene palette resolves --video-accent once at load.
initVideoColor();

createRoot(document.getElementById('root')!).render(<App />);
