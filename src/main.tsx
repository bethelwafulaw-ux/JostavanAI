import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useThemeStore } from '@/stores/themeStore';

// Initialize theme on app load
const initTheme = () => {
  const storedTheme = localStorage.getItem('jostavan-theme');
  if (storedTheme) {
    const parsed = JSON.parse(storedTheme);
    document.documentElement.classList.add(parsed.state?.theme || 'dark');
  } else {
    document.documentElement.classList.add('dark');
  }
};

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
