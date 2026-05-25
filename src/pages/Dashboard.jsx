import React from 'react';
import { useAuth } from "react-oidc-context";

export default function Dashboard() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "5amua03gvll1kessno4gebpvp2";
    const cognitoDomain = "https://us-east-1vi9tx818s.auth.us-east-1.amazoncognito.com";

    const isLocalHost = window.location.hostname === "localhost";
    const prodUrl = "https://d301k4n40unscb.cloudfront.net";
    const localUrl = "http://localhost:5173";

    const logoutUri = isLocalHost ? localUrl : prodUrl;
    
    // Limpa o usuário do React e chama a URL de desconexão da AWS
    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Painel do Aluno</h1>
      <p>Login realizado com sucesso na AWS! 🎉</p>
      <p>Usuário autenticado: {auth.user?.profile.email}</p>
      
      {/* O botão agora chama a nova função signOutRedirect */}
      <button onClick={() => signOutRedirect()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px' }}>
        Sair da Plataforma
      </button>
    </div>
  );
}