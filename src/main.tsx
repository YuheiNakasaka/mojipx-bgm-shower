import '@fontsource/silkscreen/400.css';
import '@fontsource/pixelify-sans/400.css';
import 'mojipx/styles.css';
import './app/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
