
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Uso de caminho relativo './sw.js' é mais seguro para diferentes ambientes
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('SW registrado:', registration.scope);
        })
        .catch(err => {
          console.log('Erro SW:', err);
        });
    });
  }
} else {
  console.error("Elemento root não encontrado!");
}
