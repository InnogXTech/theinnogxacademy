import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  // SPA Fix: If user is on a legacy path without hash, attempt a rewrite
  // This helps when the server fails to handle sub-paths correctly
  if (window.location.pathname !== '/' && !window.location.hash) {
    const path = window.location.pathname;
    window.location.replace(`/#${path}`);
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Critical React Mount Failure:", err);
    rootElement.innerHTML = `
      <div style="text-align:center; color:#ef4444; font-family:sans-serif; padding: 40px; background: #0f172a; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <h1 style="font-weight:900; color: white;">INITIALIZATION_ERROR</h1>
        <p style="color: #94a3b8;">The application failed to mount. Please check the console for details.</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #8a03aa; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
      </div>
    `;
  }
};

// Start the application
mountApp();