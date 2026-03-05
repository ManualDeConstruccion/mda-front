import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      loginWithGoogle(tokenResponse.access_token);
    },
    onError: () => {
      console.error('Error en el login de Google');
    },
  });

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Bienvenido</h1>
        <p className={styles.subtitle}>Inicia sesión para continuar</p>

        <div className={styles.googleButton}>
          <GoogleSignInButton onClick={() => googleLogin()} />
        </div>
      </div>
    </div>
  );
};

export default Login;
