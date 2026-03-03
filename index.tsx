
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Elemento root não encontrado!");
}

// Registra o Service Worker para PWA
if ('serviceWorker' in navigator) {
  // Unregister existing SW to fix cache issues
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for(let registration of registrations) {
      registration.unregister();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registrado com sucesso:', registration.scope);
      })
      .catch(err => {
        console.log('Falha ao registrar SW:', err);
      });
  });
}
