import './TechStack.css';
import iconAws from '../assets/tech/aws.svg';
import iconPython from '../assets/tech/python.svg';
import iconFastapi from '../assets/tech/fastapi.svg';
import iconPostgresql from '../assets/tech/postgresql.svg';
import iconReact from '../assets/tech/react.svg';
import iconDocker from '../assets/tech/docker.svg';
import iconNode from '../assets/tech/nodedotjs.svg';
import iconGithubActions from '../assets/tech/githubactions.svg';
import iconAnthropic from '../assets/tech/anthropic.svg';

const technologies = [
  { name: 'AWS', icon: iconAws },
  { name: 'Python', icon: iconPython },
  { name: 'FastAPI', icon: iconFastapi },
  { name: 'PostgreSQL', icon: iconPostgresql },
  { name: 'React', icon: iconReact },
  { name: 'Docker', icon: iconDocker },
  { name: 'Node.js', icon: iconNode },
  { name: 'GitHub Actions', icon: iconGithubActions },
  { name: 'Claude (Anthropic)', icon: iconAnthropic },
];

export default function TechStack() {
  return (
    <section className="techstack">
      <div className="techstack__container">
        <p className="techstack__eyebrow">Por baixo do capô</p>
        <h2 className="techstack__title">
          Tecnologia séria,<br />
          <span className="techstack__title-accent">pensada pra escalar.</span>
        </h2>
        <p className="techstack__subtitle">
          Construída com as mesmas ferramentas que grandes plataformas usam em produção.
        </p>
        <div className="techstack__grid">
          {technologies.map((t) => (
            <div className="techstack__item" key={t.name}>
              <img src={t.icon} alt={t.name} className="techstack__icon" />
              <span className="techstack__name">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
