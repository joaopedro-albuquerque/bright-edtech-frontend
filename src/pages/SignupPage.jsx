import React, { useState } from 'react';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import './SignupPage.css';
import imageLogin from '../assets/ImageLogin.png';
import logo from '../assets/Logo-Edtech.png';
import { API_BASE } from '../config';

export default function SignUpPage() {
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [cognitoId, setCognitoId] = useState('');
  const [cognitoConfirmed, setCognitoConfirmed] = useState(false);

  // step 1 = formulário | step 2 = confirmação de e-mail
  const [step, setStep]         = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');

  const navigate = useNavigate();

  // Regras de senha para feedback em tempo real
  const passwordRules = [
    { label: 'Mínimo 8 caracteres',         ok: password.length >= 8 },
    { label: 'Letra maiúscula',              ok: /[A-Z]/.test(password) },
    { label: 'Número',                       ok: /[0-9]/.test(password) },
  ];
  const passwordValid = passwordRules.every((r) => r.ok);

  // ── Passo 1: criar a conta no Cognito ──
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!passwordValid) {
      setErrorMsg('A senha não atende a todos os requisitos.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { userId } = await signUp({
        username: email,
        password,
      });
      setCognitoId(userId);
      setStep(2);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      if (error.name === 'UsernameExistsException') {
        setErrorMsg('Este e-mail já possui uma conta. Tente fazer login.');
      } else if (error.name === 'InvalidPasswordException') {
        setErrorMsg('Senha inválida. Verifique os requisitos abaixo.');
      } else if (error.name === 'InvalidParameterException') {
        setErrorMsg('Dados inválidos. Confira os campos e tente novamente.');
      } else {
        setErrorMsg('Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Passo 2: confirmar o código recebido por e-mail ──
  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Só confirma no Cognito se ainda não foi confirmado
      if (!cognitoConfirmed) {
        await confirmSignUp({ username: email, confirmationCode: confirmCode });
        setCognitoConfirmed(true);
      }

      // Salva no banco — obrigatório para evitar conta fantasma
      try {
        const res = await fetch(`${API_BASE}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            nome: `${firstName} ${lastName}`,
            estilo_preferido: "",
            formato_preferido: "",
            objetivos_estudo: "",
            cognito_id: cognitoId
          }),
        });
        if (!res.ok) throw new Error('db_error');
      } catch {
        setErrorMsg('Conta verificada, mas houve um erro ao salvar seu perfil. Clique em "Confirmar e-mail" para tentar novamente.');
        return;
      }

      navigate('/login', {
        state: { message: 'Conta criada com sucesso! Faça seu login.' },
      });

    } catch (error) {
      console.error('Erro na confirmação:', error);
      if (error.name === 'CodeMismatchException') {
        setErrorMsg('Código inválido. Confira o e-mail e tente novamente.');
      } else if (error.name === 'ExpiredCodeException') {
        setErrorMsg('Este código expirou. Clique em "Reenviar" para receber um novo.');
      } else {
        setErrorMsg('Não foi possível confirmar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendSignUpCode({ username: email });
      setErrorMsg('');
    } catch {
      setErrorMsg('Não foi possível reenviar o código. Tente novamente.');
    }
  };

  return (
    <div className="lp-root su-root">

      {/* ══════════════════════════════════════════
          COLUNA ESQUERDA — formulário
      ══════════════════════════════════════════ */}
      <div className="lp-form-col">
        <div className="lp-form-card">

          <h1 className="lp-form-card__title">Bright EdTech</h1>
          <p className="lp-form-card__subtitle">
            {step === 1
              ? 'Crie sua conta e comece a dominar qualquer conteúdo.'
              : `Código enviado para ${email}. Verifique sua caixa de entrada.`}
          </p>

          {/* Mensagem de erro */}
          {errorMsg && (
            <div className="lp-error" role="alert" style={{ marginBottom: '1rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

          {/* ── PASSO 1: Formulário de cadastro ── */}
          {step === 1 && (
            <form onSubmit={handleSignUp} className="lp-form" noValidate>

              {/* Nome e Sobrenome lado a lado */}
              <div className="su-name-row">
                <div className="lp-field">
                  <label className="lp-field__label" htmlFor="su-firstname">Nome</label>
                  <input
                    id="su-firstname"
                    className="lp-field__input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Maria"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="lp-field">
                  <label className="lp-field__label" htmlFor="su-lastname">Sobrenome</label>
                  <input
                    id="su-lastname"
                    className="lp-field__input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Silva"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="lp-field">
                <label className="lp-field__label" htmlFor="su-email">E-mail</label>
                <input
                  id="su-email"
                  className="lp-field__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aluno@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Senha */}
              <div className="lp-field">
                <label className="lp-field__label" htmlFor="su-password">Senha</label>
                <div className="lp-field__input-wrap">
                  <input
                    id="su-password"
                    className="lp-field__input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Checklist de requisitos da senha */}
                {password.length > 0 && (
                  <ul className="su-password-rules">
                    {passwordRules.map((rule) => (
                      <li
                        key={rule.label}
                        className={`su-password-rules__item ${rule.ok ? 'su-password-rules__item--ok' : ''}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          {rule.ok ? (
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          ) : (
                            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
                          )}
                        </svg>
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                className={`lp-submit${isLoading ? ' lp-submit--loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="lp-submit__spinner" aria-hidden="true" />
                    Criando conta…
                  </>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </form>
          )}

          {/* ── PASSO 2: Confirmação por e-mail ── */}
          {step === 2 && (
            <form onSubmit={handleConfirm} className="lp-form" noValidate>
              <div className="su-confirm-icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 7l10 7 10-7"/>
                </svg>
              </div>

              <div className="lp-field">
                <label className="lp-field__label" htmlFor="su-code">
                  Código de verificação
                </label>
                <input
                  id="su-code"
                  className="lp-field__input fp-input--code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  required
                />
              </div>

              <button
                type="submit"
                className={`lp-submit${isLoading ? ' lp-submit--loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="lp-submit__spinner" aria-hidden="true" />
                    Confirmando…
                  </>
                ) : (
                  'Confirmar e-mail'
                )}
              </button>
            </form>
          )}

          {/* Reenviar código (passo 2) */}
          {step === 2 && (
            <p className="fp-resend">
              Não recebeu o código?{' '}
              <button type="button" className="fp-resend__btn" onClick={handleResend}>
                Reenviar
              </button>
            </p>
          )}

          <p className="lp-register">
            Já tem uma conta?{' '}
            <Link to="/login" className="lp-register__link">Fazer login</Link>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          COLUNA DIREITA — branding (espelhado)
      ══════════════════════════════════════════ */}
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

    </div>
  );
}