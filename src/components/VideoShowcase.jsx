import { useEffect, useState } from 'react';
import './VideoShowcase.css';

const VIDEO_HORIZONTAL = '/videos/bright-1920x1080.mp4';
const VIDEO_VERTICAL = '/videos/bright-1080x1920.mp4';
const RETRATO = '(max-aspect-ratio: 1/1)';

function usaRetrato() {
  try {
    return window.matchMedia(RETRATO).matches;
  } catch {
    return false;
  }
}

export default function VideoShowcase() {
  const [retrato, setRetrato] = useState(usaRetrato);

  useEffect(() => {
    const mq = window.matchMedia(RETRATO);
    const onChange = (e) => setRetrato(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <section className="showcase">
      <div className="showcase__container">
        <p className="showcase__eyebrow">Veja na prática</p>
        <h2 className="showcase__title">
          Do PDF ao estudo,<br />
          <span className="showcase__title-accent">em poucos cliques.</span>
        </h2>
        <p className="showcase__description">
          Assista como a Bright transforma seus materiais em resumos, flashcards e
          quizzes, e agenda a revisão de cada item na hora certa.
        </p>

        <div className={`showcase__frame${retrato ? ' showcase__frame--retrato' : ''}`}>
          <video
            key={retrato ? 'v' : 'h'}
            className="showcase__video"
            src={retrato ? VIDEO_VERTICAL : VIDEO_HORIZONTAL}
            controls
            playsInline
            preload="metadata"
            aria-label="Vídeo de apresentação da Bright EdTech"
          />
        </div>
      </div>
    </section>
  );
}
