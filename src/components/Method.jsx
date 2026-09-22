import './Method.css';
import { RESUMO_FORMATOS } from '../constants/resumoFormatos';

export default function Method() {
  return (
    <section className="method">
      <div className="method__container">
        <p className="method__eyebrow">Base científica</p>
        <h2 className="method__title">
          Não é só IA bonitinha.<br />
          <span className="method__title-accent">É método comprovado.</span>
        </h2>
        <p className="method__description">
          A Bright é construída em cima da <strong>repetição espaçada</strong>, uma das
          técnicas mais estudadas pela psicologia cognitiva pra vencer a curva do
          esquecimento. Em vez de reler tudo de uma vez, cada flashcard volta pra você
          no momento certo — mais perto quando você acabou de aprender, cada vez mais
          espaçado conforme você domina o conteúdo. É o mesmo princípio por trás de
          apps como Anki, só que aqui os cartões são gerados automaticamente a partir
          dos seus próprios materiais.
        </p>

        <div className="method__formats">
          <p className="method__formats-label">
            E como nem todo estudo pede o mesmo formato, a Bright já vem com 3 modelos de resumo prontos:
          </p>
          <div className="method__formats-grid">
            {RESUMO_FORMATOS.map((f) => (
              <div className="method__format-card" key={f.value}>
                <span className="method__format-name">{f.label}</span>
                <p className="method__format-description">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
