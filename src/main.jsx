import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';
import { COGNITO_USER_POOL_ID, COGNITO_USER_POOL_CLIENT_ID, COGNITO_REGION } from './config';

// Configure Amplify using env vars (with safe fallbacks)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: COGNITO_USER_POOL_ID,
      userPoolClientId: COGNITO_USER_POOL_CLIENT_ID,
      region: COGNITO_REGION,
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);