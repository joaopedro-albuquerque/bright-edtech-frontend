import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from 'react-oidc-context';

const isLocalHost = window.location.hostname === "localhost";
const prodUrl = "https://d301k4n40unscb.cloudfront.net";
const localUrl = "http://localhost:5173"

const cognitoAuthConfig = {
  authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_VI9tx818s',
  client_id: '5amua03gvll1kessno4gebpvp2',
  redirect_uri: isLocalHost ? localUrl : prodUrl,
  response_type: 'code',
  scope: 'openid profile email',
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);