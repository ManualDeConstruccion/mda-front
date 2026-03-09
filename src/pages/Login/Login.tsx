import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import LinkedInSignInButton from '../../components/LinkedInSignInButton/LinkedInSignInButton';
import FormInput from '../../components/common/FormInput/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import styles from './Login.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Login: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, completeSocialLogin } = useAuth();
  const location = useLocation();
  const state = location.state as { registered?: boolean; passwordReset?: boolean } | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      loginWithGoogle(tokenResponse.access_token);
    },
    onError: () => {
      setError('Error al iniciar sesión con Google');
    },
  });

  const handleLinkedInMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'social-auth-success') {
      const { accessToken, refreshToken, user } = event.data;
      completeSocialLogin(accessToken, refreshToken, user);
    } else if (event.data?.type === 'social-auth-error') {
      setError('Error al iniciar sesión con LinkedIn');
    }
  }, [completeSocialLogin]);

  useEffect(() => {
    window.addEventListener('message', handleLinkedInMessage);
    return () => window.removeEventListener('message', handleLinkedInMessage);
  }, [handleLinkedInMessage]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'social_auth_complete' && e.newValue) {
        localStorage.removeItem('social_auth_complete');
        const access = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');
        const userStr = localStorage.getItem('user');
        if (access && refresh) {
          const user = userStr ? JSON.parse(userStr) : undefined;
          completeSocialLogin(access, refresh, user);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [completeSocialLogin]);

  const handleLinkedInLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      `${API_URL}/api/auth/social/linkedin/authorize/`,
      'LinkedIn Login',
      `width=${width},height=${height},left=${left},top=${top}`,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Bienvenido</h1>
        <p className={styles.subtitle}>Inicia sesión para continuar</p>

        {state?.registered && (
          <p className={styles.successMessage}>Cuenta creada. Inicia sesión con tu correo y contraseña.</p>
        )}
        {state?.passwordReset && (
          <p className={styles.successMessage}>Contraseña actualizada. Inicia sesión con tu nueva contraseña.</p>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormInput
            type="email"
            name="email"
            label="Correo electrónico"
            value={email}
            onChange={setEmail}
            placeholder="tu@correo.com"
            autoComplete="email"
          />
          <FormInput
            type="password"
            name="password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            showPasswordToggle
            autoComplete="current-password"
          />
          {error && <p className={styles.formError} role="alert">{error}</p>}
          <PrimaryButton type="submit" fullWidth loading={loading}>
            Iniciar sesión
          </PrimaryButton>
        </form>

        <div className={styles.forgotWrap}>
          <Link to="/login/recuperar-contrasena" className={styles.link}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className={styles.divider}>
          <span>o continúa con</span>
        </div>

        <div className={styles.socialButtons}>
          <GoogleSignInButton onClick={() => googleLogin()} />
          <LinkedInSignInButton onClick={handleLinkedInLogin} />
        </div>

        <p className={styles.registerHint}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className={styles.link}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
