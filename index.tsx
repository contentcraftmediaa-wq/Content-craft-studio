import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Capture PWA install prompt globally to avoid race conditions
// This must happen immediately, before React mounts
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile (we use a custom button)
  e.preventDefault();
  // Stash the event so it can be triggered later by the UI component
  (window as any).deferredPrompt = e;
  console.log("PWA Install Prompt fired and captured globally");
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      },
      (err) => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}
