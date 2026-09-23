import React, { useEffect, useState } from 'react';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('Carregando...');
  const [runTour, setRunTour] = useState(false); // 2. Estado para controlar o tour
  const navigate = useNavigate();

  // 3. Definindo os passos. O "target" deve bater com as classes nos elementos HTML abaixo.
  const tourSteps = [
    {
      target: '.tour-boas-vindas',
      content: 'Bem-vindo ao Painel do Aluno! Aqui começa a sua jornada de estudos.',
      disableBeacon: true, // Mostra o balão de imediato
    },
    {
      target: '.tour-email',
      content: 'Aqui você pode verificar o e-mail associado à sua conta.',
    },
    {
      target: '.tour-logout',
      content: 'Quando terminar, clique aqui para sair da plataforma com segurança.',
    }
  ];

  useEffect(() => {
    // Busca as informações do usuário logado na AWS
    async function getUserData() {
      try {
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email);
        
        // Simulação: Aqui você consultaria o seu backend para verificar a coluna tour_concluido
        // Exemplo:
        // const response = await api.get('/usuarios/me');
        // if (response.data.tour_concluido === false) { setRunTour(true); }
        
        // Ativando temporariamente para você ver funcionando:
        setRunTour(true);

      } catch (error) {
        console.error('Erro ao buscar atributos do usuário:', error);
        setUserEmail('Usuário sem e-mail cadastrado');
      }
    }
    
    getUserData();
  }, []);

  // 4. Captura quando o usuário termina ou pula o tour
  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRunTour(false); // Esconde o tour
      
      // Aqui você enviará o PATCH/PUT para o backend:
      // await api.patch('/usuarios/me/tour', { tour_concluido: true });
      console.log('Tour concluído! (Falta integrar a chamada ao banco)');
    }
  };

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
      
      {/* 5. Renderizando o componente invisível que controla a tela */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#556b2f', // Puxando a cor verde oliva do seu botão
            zIndex: 10000,
          }
        }}
      />

      {/* 6. Adicionando as classes (targets) para os balões apontarem */}
      <h1 className="tour-boas-vindas">Painel do Aluno</h1>
      <p>Login realizado com sucesso na AWS! 🎉</p>
      <p className="tour-email">Usuário autenticado: <strong>{userEmail}</strong></p>
      
      <button 
        className="tour-logout"
        onClick={handleLogout} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          cursor: 'pointer', 
          backgroundColor: '#556b2f', 
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