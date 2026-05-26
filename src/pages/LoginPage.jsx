import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';
import imageLogin from '../assets/ImageLogin.png';
import logo from '../assets/Logo-Edtech.png';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const { isSignedIn } = await signIn({ username: email, password });
            if (isSignedIn) navigate('/dashboard');
        } catch (error) {
            console.error('Erro no login:', error);
            // Mensagens amigáveis por código de erro do Cognito
            if (error.name === 'NotAuthorizedException') {
                setErrorMsg('E-mail ou senha incorretos. Tente novamente.');
            } else if (error.name === 'UserNotFoundException') {
                setErrorMsg('Nenhuma conta encontrada com este e-mail.');
            } else if (error.name === 'UserNotConfirmedException') {
                setErrorMsg('Conta não confirmada. Verifique seu e-mail.');
            } else {
                setErrorMsg('Ocorreu um erro inesperado. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="lp-root">
            {/* ── COLUNA ESQUERDA: branding ── */}
            <div className="lp-brand">
                {/* Padrão de pontos decorativo */}
                <div className="lp-brand__dots" aria-hidden="true" />

                {/* Logo */}
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

                {/* Tagline */}
                <p className="lp-brand__tagline">
                    Pronto para dominar<br />o conteúdo de hoje?
                </p>

                {/* Ilustração central — substitua src pela imagem real */}
                <div className="lp-brand__illustration">
                    <img
                        src={imageLogin}
                        alt="Ilustração de cérebro conectado"
                        className="lp-brand__illustration-img"
                    />
                </div>

                {/* Glow central */}
                <div className="lp-brand__glow" aria-hidden="true" />
            </div>

            {/* ── COLUNA DIREITA: formulário ── */}
            <div className="lp-form-col">
                <div className="lp-form-card">
                    <h1 className="lp-form-card__title">Bright EdTech</h1>
                    <p className="lp-form-card__subtitle">Sua base de conhecimento inteligente.</p>

                    <form onSubmit={handleLogin} className="lp-form" noValidate>
                        {/* E-mail */}
                        <div className="lp-field">
                            <label className="lp-field__label" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
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
                            <div className="lp-field__label-row">
                                <label className="lp-field__label" htmlFor="password">
                                    Senha
                                </label>
                                <Link to="/forgot-password" className="lp-field__forgot">
                                    Esqueci a minha senha
                                </Link>
                            </div>
                            <div className="lp-field__input-wrap">
                                <input
                                    id="password"
                                    className="lp-field__input"
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="lp-field__eye"
                                    onClick={() => setShowPass((v) => !v)}
                                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPass ? (
                                        // eye-off
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        // eye
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mensagem de erro */}
                        {errorMsg && (
                            <div className="lp-error" role="alert">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {errorMsg}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className={`lp-submit${isLoading ? ' lp-submit--loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="lp-submit__spinner" aria-hidden="true" />
                                    Autenticando…
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Link de cadastro */}
                    <p className="lp-register">
                        Não tem uma conta?{' '}
                        <Link to="/signup" className="lp-register__link">
                            Criar conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}