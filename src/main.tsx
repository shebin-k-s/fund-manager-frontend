import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import React from "react";

// Inputs use enterKeyHint="done" (✓ key on mobile keyboards). Pressing it
// sends Enter; unless the field handles Enter itself (e.g. unlock, quick
// payment), close the keyboard.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.defaultPrevented) return;
  const target = e.target;
  if (target instanceof HTMLInputElement) target.blur();
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Service Worker for notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
};
