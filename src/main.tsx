import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTheme } from './shell/theme';
import './index.css';

initTheme();

createRoot(document.getElementById('root')!).render(<App />);
