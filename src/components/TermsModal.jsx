import './TermsModal.css';
import { TERMOS_DE_USO_VERSAO } from '../config';

export default function TermsModal({ onClose }) {
  return (
    <div className="tm-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tm-modal">
        <div className="tm-modal__header">
          <div>
            <h2 className="tm-modal__title">Termos de Uso e Política de Privacidade</h2>
            <p className="tm-modal__version">Versão {TERMOS_DE_USO_VERSAO}</p>
          </div>
          <button className="tm-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="tm-modal__body">
          <section className="tm-section">
            <h3>1. Aceitação dos termos</h3>
            <p>
              Ao criar uma conta na Bright EdTech, você declara ter lido, compreendido e
              aceitado integralmente este Termo de Uso e esta Política de Privacidade.
              O aceite fica registrado com data, hora e versão do termo vigente no momento
              do cadastro.
            </p>
          </section>

          <section className="tm-section">
            <h3>2. Tratamento de dados pessoais (LGPD)</h3>
            <p>
              Coletamos e tratamos seus dados pessoais (nome, e-mail e os documentos que
              você envia para a plataforma) com base na Lei Geral de Proteção de Dados
              (Lei nº 13.709/2018), para as finalidades de: criar e manter sua conta,
              processar os documentos enviados para gerar resumos, flashcards e quizzes,
              e melhorar a experiência de estudo oferecida pela plataforma.
            </p>
            <p>
              Você tem direito a solicitar, a qualquer momento, a confirmação do
              tratamento, o acesso, a correção, a anonimização, a portabilidade ou a
              exclusão dos seus dados pessoais, conforme previsto na LGPD.
            </p>
          </section>

          <section className="tm-section">
            <h3>3. Direitos autorais sobre os documentos enviados</h3>
            <p>
              Você é o único responsável pelo conteúdo dos documentos que envia para a
              plataforma e declara possuir os direitos necessários sobre esse material
              (seja por ser o autor original, ou por possuir licença/autorização de uso).
              A Bright EdTech não reivindica propriedade sobre o conteúdo enviado — ele é
              utilizado apenas para gerar os materiais de estudo solicitados por você.
            </p>
          </section>

          <section className="tm-section">
            <h3>4. Conteúdo gerado por inteligência artificial</h3>
            <p>
              Resumos, flashcards e quizzes são gerados automaticamente por modelos de
              inteligência artificial a partir dos documentos enviados. Esse conteúdo pode
              conter imprecisões, omissões ou erros de interpretação do material original.
              Recomendamos sempre conferir o conteúdo gerado com o documento-fonte antes de
              utilizá-lo como única referência de estudo.
            </p>
          </section>

          <section className="tm-section">
            <h3>5. Exclusão de conta e dados</h3>
            <p>
              Você pode excluir sua conta a qualquer momento pela página de perfil. A
              exclusão remove seus dados pessoais e os documentos/materiais associados à
              sua conta de forma permanente, exceto quando a retenção for exigida por
              obrigação legal.
            </p>
          </section>

          <section className="tm-section">
            <h3>6. Alterações neste termo</h3>
            <p>
              Este termo pode ser atualizado periodicamente. Alterações relevantes exigem
              um novo aceite por parte de novos usuários a partir da versão publicada; a
              versão vigente no momento do seu cadastro é a que consta registrada na sua
              conta.
            </p>
          </section>

          <p className="tm-disclaimer">
            Este documento é um modelo estrutural e deve ser revisado por um profissional
            jurídico antes de ser considerado juridicamente vinculante.
          </p>
        </div>

        <div className="tm-modal__footer">
          <button className="tm-btn tm-btn--primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
