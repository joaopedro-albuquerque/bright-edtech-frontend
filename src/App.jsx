import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const auth = useAuth();

  // Mostra uma mensagem simples enquanto a AWS valida o token
  if (auth.isLoading) {
    return <LoadingScreen />;
  }

  // Tratamento de erro caso a AWS recuse o login
  if (auth.error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        <h2>Ocorreu um erro no login: {auth.error.message}</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota principal: Se estiver logado, pula direto pro Dashboard. Se não, mostra a Landing Page. */}
        <Route 
          path="/" 
          element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} 
        />
        
        {/* Rota protegida: Se não estiver logado e tentar acessar o Dashboard, é expulso de volta pra raiz. */}
        <Route 
          path="/dashboard" 
          element={auth.isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}