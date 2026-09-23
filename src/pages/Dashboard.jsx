import React, { useEffect, useState } from 'react';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('Carregando...');
  const navigate = useNavigate();

  useEffect(() => {
    // Busca as informações do usuário logado na AWS
    async function getUserData() {
      try {
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email);
      } catch (error) {
        console.error('Erro ao buscar atributos do usuário:', error);
        setUserEmail('Usuário sem e-mail cadastrado');
      }
    }
    
    getUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // Chama a função oficial do Amplify para encerrar a sessão
      await signOut();
      
      // Garante que o usuário seja devolvido para a tela de login
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Painel do Aluno</h1>
      <p>Login realizado com sucesso na AWS! 🎉</p>
      <p>Usuário autenticado: <strong>{userEmail}</strong></p>
      
      <button 
        onClick={handleLogout} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          cursor: 'pointer', 
          backgroundColor: '#556b2f', // Verde oliva combinando com sua paleta
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        Sair da Plataforma
      </button>
    </div>
  );
}