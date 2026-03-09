import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthCallback.module.scss';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { completeSocialLogin } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = searchParams.get('error');
    if (error) {
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'social-auth-error', error }, window.location.origin);
          window.close();
          return;
        }
      } catch { /* cross-origin — opener lost */ }
      return;
    }

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    if (!accessToken || !refreshToken) return;

    const userData = {
      id: Number(searchParams.get('id')) || 0,
      email: searchParams.get('email') || '',
      first_name: searchParams.get('first_name') || '',
      last_name: searchParams.get('last_name') || '',
      is_staff: searchParams.get('is_staff') === '1',
    };

    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'social-auth-success', accessToken, refreshToken, user: userData },
          window.location.origin,
        );
        window.close();
        return;
      }
    } catch { /* cross-origin — opener lost */ }

    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    if (userData.id) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    localStorage.setItem('social_auth_complete', Date.now().toString());
    window.close();

    setTimeout(() => {
      completeSocialLogin(accessToken, refreshToken, userData.id ? userData : undefined);
    }, 100);
  }, [searchParams, completeSocialLogin]);

  const error = searchParams.get('error');

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.box}>
          <h2>Error de autenticación</h2>
          <p>No se pudo completar el inicio de sesión. Inténtalo nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.spinner} />
        <p>Completando inicio de sesión...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
