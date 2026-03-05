import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getCsrfToken } from '../../context/AuthContext';
import FormInput from '../../components/common/FormInput/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import styles from './ForgotPassword.module.scss';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setLoading(true);
    try {
      const csrfToken = await getCsrfToken();
      await api.post('/api/auth/password/reset/', {
        email: email.trim(),
      }, { headers: { 'X-CSRFToken': csrfToken } });
      setSuccess(true);
    } catch (err) {
      if ((err as any)?.isAxiosError) {
        const msg =
          (err as any).response?.data?.email?.[0] ??
          (err as any).response?.data?.detail ??
          'No pudimos enviar el enlace. Revisa el correo o intenta más tarde.';
        setError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setError('Error al solicitar el restablecimiento');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.box}>
          <h1 className={styles.title}>Revisa tu correo</h1>
          <p className={styles.message}>
            Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login" className={styles.linkButton}>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>¿Olvidaste tu contraseña?</h1>
        <p className={styles.subtitle}>
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>

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
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" fullWidth loading={loading}>
            Enviar enlace
          </PrimaryButton>
        </form>

        <p className={styles.backWrap}>
          <Link to="/login" className={styles.link}>
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
