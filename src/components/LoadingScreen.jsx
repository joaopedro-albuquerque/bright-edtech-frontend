import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import animationData from '../assets/loading.json';
import './LoadingScreen.css';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen__content">
        <DotLottieReact 
          data={animationData} 
          loop 
          autoplay 
          style={{ width: 180, height: 180 }} 
        />
        <h2 className="loading-screen__text">
          Preparando sua base de conhecimento...
        </h2>
      </div>
    </div>
  );
}