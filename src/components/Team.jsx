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
          Somos quatro estudantes de Análise e Desenvolvimento de Sistemas e a Bright
          nasceu como nosso trabalho de conclusão de curso, mas a motivação vem de
          um problema bem real que a gente vive na pele. Levantamos dados com outros
          universitários e o retrato foi claro: metade nem conhece o método de
          repetição espaçada, e boa parte de quem conhece não consegue manter a
          constância porque não tem uma ferramenta simples pra isso. Some a isso o
          tempo perdido procurando material espalhado em pastas e apps diferentes, e
          fica óbvio o tamanho do problema. Foi por isso que construímos a Bright: uma
          plataforma leve, com interface amigável, que usa IA pra transformar qualquer
          material em resumo e flashcard prontos pra revisão, sem fricção e sem curva
          de aprendizado.
        </p>
        <div className="team__grid">
          {founders.map((f) => (
            <div className="team__card" key={f.name}>
              <div className="team__card-photo">
                <img src={f.photo} alt={f.name} />
              </div>
              <span className="team__card-name">{f.name}</span>
              <span className="team__card-role">Estudante de ADS</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
