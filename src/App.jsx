import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import LoadingScreen from './components/LoadingScreen';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Verifica se o usuário já está logado ao abrir o site
    checkUser();

    // 2. Fica escutando os eventos de login/logout em tempo real
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          setIsAuthenticated(true);
          break;
        case 'signedOut':
          setIsAuthenticated(false);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkUser() {
    try {
      // Tenta buscar o usuário logado no Amplify
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch (error) {
      // Se der erro, significa que não tem ninguém logado
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }

  // Mostra a sua animação do Lottie enquanto verifica o token
  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Raiz: Mostra a Landing Page para todos */}
        <Route 
          path="/" 
          element={<LandingPage />} 
        />

        {/* Nova rota de Login: Se já estiver logado, joga pro Dashboard */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />

        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />} 
        />
        
        {/* Dashboard protegido: Se não estiver logado, joga pra tela de Login */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}