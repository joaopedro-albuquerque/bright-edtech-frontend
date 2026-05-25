import Lottie from 'lottie-react';
import loadingAnimation from '../assets/loading.json';

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#ffffff',
      padding: '24px',
      textAlign: 'center'
    }}>
      <Lottie animationData={loadingAnimation} loop={true} style={{ width: 260, height: 260 }} />
      <p style={{ marginTop: 24, fontFamily: 'DM Sans, sans-serif', color: '#0a1535', fontSize: '1rem', maxWidth: 380 }}>
        Aguarde um instante enquanto preparamos sua sessão de login ou cadastro.
      </p>
    </div>
  );
}