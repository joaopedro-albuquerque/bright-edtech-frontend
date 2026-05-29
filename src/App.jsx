import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import LoadingScreen from './components/LoadingScreen';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SignupPage from './pages/SignupPage';
import DashboardLayout from './components/DashboardLayout';
import DocumentsPage from './pages/DocumentsPage';

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

        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} 
        />
        
        <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<DocumentsPage />} />
          {/* <Route path="/flashcards" element={<FlashcardsPage />} /> */}
          {/* <Route path="/quizzes" element={<QuizzesPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}