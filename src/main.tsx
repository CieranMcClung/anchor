import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from './copy/t';
import App from './App';
import './index.css';

document.title = t('brand.appName');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}
