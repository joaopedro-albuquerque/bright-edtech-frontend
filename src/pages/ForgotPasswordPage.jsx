import React, { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import './ForgotPasswordPage.css';
import imageLogin from '../assets/ImageLogin.png';
import logo from '../assets/Logo-Edtech.png';

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState('');
  const [code, setCode]             = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass]     = useState(false);

  const [step, setStep]         = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');

  const navigate = useNavigate();

  // ── Passo 1: envia o código para o e-mail ──
  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await resetPassword({ username: email });
      setStep(2);
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      if (error.name === 'UserNotFoundException') {
        setErrorMsg('Não encontramos uma conta com este e-mail.');
      } else if (error.name === 'LimitExceededException') {
        setErrorMsg('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        setErrorMsg('Não foi possível enviar o código. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Passo 2: confirma nova senha com o código recebido ──
  const handleConfirmPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      navigate('/login', {
        state: { message: 'Senha alterada com sucesso! Faça seu login.' },
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      if (error.name === 'CodeMismatchException') {
        setErrorMsg('Código de verificação inválido. Confira o e-mail e tente novamente.');
      } else if (error.name === 'ExpiredCodeException') {
        setErrorMsg('Este código expirou. Volte ao passo anterior e solicite um novo.');
      } else if (error.name === 'InvalidPasswordException') {
        setErrorMsg('A senha não atende aos requisitos mínimos (mín. 8 caracteres, letras e números).');
      } else {
        setErrorMsg('Ocorreu um erro. Verifique os dados e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root">

      {/* ── COLUNA ESQUERDA — idêntica à LoginPage ── */}
      <div className="lp-brand">
        <div className="lp-brand__dots" aria-hidden="true" />

        <div className="lp-brand__logo">
          <img
            src={logo}
            alt="Bright EdTech logo"
            className="lp-brand__logo-icon"
          />
          <div className="lp-brand__logo-text">
            <span className="lp-brand__logo-name">BRIGHT</span>
            <span className="lp-brand__logo-sub">EDTECH</span>
          </div>
        </div>

        <p className="lp-brand__tagline">
          Pronto para dominar<br />o conteúdo de hoje?
        </p>

        <div className="lp-brand__illustration">
          <img
            src={imageLogin}
            alt="Ilustração de cérebro conectado"
            className="lp-brand__illustration-img"
          />
        </div>

        <div className="lp-brand__glow" aria-hidden="true" />
      </div>

      {/* ── COLUNA DIREITA — recuperação de senha ── */}
      <div className="lp-form-col">
        <div className="lp-form-card">

          {/* Indicador de passo */}
          <div className="fp-steps" aria-label="Progresso">
            <div className={`fp-steps__item ${step >= 1 ? 'fp-steps__item--done' : ''}`}>
              <span className="fp-steps__bubble">1</span>
              <span className="fp-steps__label">E-mail</span>
            </div>
            <div className="fp-steps__line" />
            <div className={`fp-steps__item ${step >= 2 ? 'fp-steps__item--done' : ''}`}>
              <span className="fp-steps__bubble">2</span>
              <span className="fp-steps__label">Nova senha</span>
            </div>
          </div>

          <h1 className="lp-form-card__title">Recuperar senha</h1>
          <p className="lp-form-card__subtitle">
            {step === 1
              ? 'Informe seu e-mail e enviaremos um código de verificação.'
              : `Código enviado para ${email}. Digite-o abaixo com sua nova senha.`}
          </p>

          {/* Mensagem de erro */}
          {errorMsg && (
            <div className="lp-error" role="alert" style={{ marginBottom: '1rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={step === 1 ? handleSendCode : handleConfirmPassword}
            className="lp-form"
            noValidate
          >

            {/* Campo e-mail — sempre visível; readonly no passo 2 */}
            <div className="lp-field">
              <label className="lp-field__label" htmlFor="fp-email">E-mail</label>
              <input
                id="fp-email"
                className={`lp-field__input fp-input${step === 2 ? ' fp-input--readonly' : ''}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aluno@email.com"
                readOnly={step === 2}
                autoComplete="email"
                required
              />
            </div>

            {/* Campos do passo 2 — entram com animação */}
            {step === 2 && (
              <>
                <div className="lp-field fp-field-animate">
                  <label className="lp-field__label" htmlFor="fp-code">
                    Código de verificação
                  </label>
                  <input
                    id="fp-code"
                    className="lp-field__input fp-input--code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <div className="lp-field fp-field-animate" style={{ animationDelay: '0.06s' }}>
                  <label className="lp-field__label" htmlFor="fp-newpass">Nova senha</label>
                  <div className="lp-field__input-wrap">
                    <input
                      id="fp-newpass"
                      className="lp-field__input"
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mín. 8 caracteres"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="lp-field__eye"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className={`lp-submit${isLoading ? ' lp-submit--loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="lp-submit__spinner" aria-hidden="true" />
                  Processando…
                </>
              ) : step === 1 ? (
                'Enviar código'
              ) : (
                'Confirmar nova senha'
              )}
            </button>
          </form>

          {/* Reenviar código (só no passo 2) */}
          {step === 2 && (
            <p className="fp-resend">
              Não recebeu o código?{' '}
              <button
                type="button"
                className="fp-resend__btn"
                onClick={() => { setStep(1); setErrorMsg(''); setCode(''); setNewPassword(''); }}
              >
                Reenviar
              </button>
            </p>
          )}

          <Link to="/login" className="fp-back">
            ← Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}