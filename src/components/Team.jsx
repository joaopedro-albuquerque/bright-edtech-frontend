import './Team.css';
import fotoEric from '../assets/team/eric.jpeg';
import fotoJoao from '../assets/team/joao.jpeg';
import fotoMiguel from '../assets/team/miguel.jpeg';
import fotoGabriela from '../assets/team/gabriela.jpeg';

const founders = [
  { name: 'Eric', photo: fotoEric },
  { name: 'João', photo: fotoJoao },
  { name: 'Miguel', photo: fotoMiguel },
  { name: 'Gabriela', photo: fotoGabriela },
];

export default function Team() {
  return (
    <section className="team">
      <div className="team__container">
        <p className="team__eyebrow">Quem construiu a Bright</p>
        <h2 className="team__title">
          Feito por quem também<br />
          <span className="team__title-accent">vive a rotina de estudar.</span>
        </h2>
        <p className="team__mission">
          A Bright nasceu de uma frustração bem real: estudar hoje em dia é caótico.
          Material espalhado em pastas diferentes, ferramentas complicadas demais pra
          um uso rápido, e nenhuma delas realmente pensada pra ajudar no dia a dia de
          quem só quer revisar o conteúdo e seguir em frente. A gente sentia essa falta
          na pele — de uma plataforma leve, com interface amigável, que usasse IA de
          forma prática pra transformar qualquer material em resumo e flashcard pronto
          pra revisão, sem fricção e sem curva de aprendizado. Foi essa necessidade que
          nos fez construir a Bright.
        </p>
        <div className="team__grid">
          {founders.map((f) => (
            <div className="team__card" key={f.name}>
              <div className="team__card-photo">
                <img src={f.photo} alt={f.name} />
              </div>
              <span className="team__card-name">{f.name}</span>
              <span className="team__card-role">Co-fundador(a)</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
