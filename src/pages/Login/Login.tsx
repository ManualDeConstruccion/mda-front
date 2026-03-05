import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import FormInput from '../../components/common/FormInput/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  const { loginWithGoogle, loginWithEmail } = useAuth();
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

        <div className={styles.googleButton}>
          <GoogleSignInButton onClick={() => googleLogin()} />
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
