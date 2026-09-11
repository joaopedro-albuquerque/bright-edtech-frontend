// Centralized runtime configuration (from Vite env vars)
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.brightedtech.com.br';
export const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_pAXD3oV3N';
export const COGNITO_USER_POOL_CLIENT_ID = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '79182l02lbdnve5v7b9117g0ue';
export const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';

export default {
  API_BASE,
  COGNITO_USER_POOL_ID,
  COGNITO_USER_POOL_CLIENT_ID,
  COGNITO_REGION,
};
