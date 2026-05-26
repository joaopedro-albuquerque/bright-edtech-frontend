import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';

// Configuração direta para o pool do Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_VI9tx818s',
      userPoolClientId: '5amua03gvll1kessno4gebpvp2',
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);