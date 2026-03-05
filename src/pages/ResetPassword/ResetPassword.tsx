import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, getCsrfToken } from '../../context/AuthContext';
import FormInput, { defaultPasswordRules } from '../../components/common/FormInput/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import styles from './ResetPassword.module.scss';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setInvalidLink(true);
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('La contraseña es obligatoria');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    const allRulesMet = defaultPasswordRules.every((r) => r.test(password));
    if (!allRulesMet) {
      setError('La contraseña no cumple todas las reglas indicadas');
      return;
    }
    setLoading(true);
    try {
      const csrfToken = await getCsrfToken();
      await api.post('/api/auth/password/reset/confirm/', {
        uid,
        token,
        new_password1: password,
        new_password2: password2,
      }, { headers: { 'X-CSRFToken': csrfToken } });
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      if ((err as any)?.isAxiosError) {
        const data = (err as any).response?.data;
        const msg =
          data?.new_password1?.[0] ??
          data?.new_password2?.[0] ??
          data?.token?.[0] ??
          data?.detail ??
          'El enlace pudo haber expirado. Solicita uno nuevo.';
        setError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setError('Error al cambiar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div className={styles.container}>
        <div className={styles.box}>
          <h1 className={styles.title}>Enlace inválido</h1>
          <p className={styles.message}>
            Falta el enlace de restablecimiento o es incorrecto. Solicita uno nuevo desde la pantalla de inicio de sesión.
          </p>
          <Link to="/login/recuperar-contrasena" className={styles.linkButton}>
            Solicitar nuevo enlace
          </Link>
          <p className={styles.backWrap}>
            <Link to="/login" className={styles.link}>
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Nueva contraseña</h1>
        <p className={styles.subtitle}>
          Elige una contraseña segura para tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormInput
            type="password"
            name="new_password1"
            label="Nueva contraseña"
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 8 caracteres"
            showPasswordToggle
            showPasswordRules
            autoComplete="new-password"
          />
          <FormInput
            type="password"
            name="new_password2"
            label="Repetir contraseña"
            value={password2}
            onChange={setPassword2}
            placeholder="Repite la contraseña"
            showPasswordToggle
            autoComplete="new-password"
          />
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" fullWidth loading={loading}>
            Cambiar contraseña
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

export default ResetPassword;
