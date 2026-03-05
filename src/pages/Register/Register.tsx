import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import FormInput, { defaultPasswordRules } from '../../components/common/FormInput/FormInput';
import PasswordRulesList from '../../components/common/FormInput/PasswordRulesList';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton';
import styles from './Register.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      loginWithGoogle(tokenResponse.access_token);
    },
    onError: () => {
      setError('Error al registrarse con Google');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('El correo es obligatorio');
      return;
    }
    if (!firstName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!lastName.trim()) {
      setError('El apellido es obligatorio');
      return;
    }
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
      await axios.post(`${API_URL}/api/auth/registration/`, {
        email: email.trim(),
        password1: password,
        password2: password2,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const msg =
          data?.email?.[0] ??
          data?.password1?.[0] ??
          data?.password2?.[0] ??
          data?.non_field_errors?.[0] ??
          data?.detail ??
          'Error al crear la cuenta';
        setError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setError('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Completa los datos para registrarte</p>

        <div className={styles.googleButton}>
          <GoogleSignInButton
            text="Registrarse con Google"
            onClick={() => googleLogin()}
          />
        </div>

        <div className={styles.divider}>
          <span>o regístrate con correo</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.formColumn}>
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
                type="text"
                name="first_name"
                label="Nombre"
                value={firstName}
                onChange={setFirstName}
                placeholder="Tu nombre"
                autoComplete="given-name"
              />
              <FormInput
                type="text"
                name="last_name"
                label="Apellido"
                value={lastName}
                onChange={setLastName}
                placeholder="Tu apellido"
                autoComplete="family-name"
              />
            </div>
            <div className={styles.formColumn}>
              <FormInput
                type="password"
                name="password1"
                label="Contraseña"
                value={password}
                onChange={setPassword}
                placeholder="Mínimo 8 caracteres"
                showPasswordToggle
                autoComplete="new-password"
              />
              <FormInput
                type="password"
                name="password2"
                label="Repetir contraseña"
                value={password2}
                onChange={setPassword2}
                placeholder="Repite la contraseña"
                showPasswordToggle
                autoComplete="new-password"
              />
              <PasswordRulesList value={password} />
            </div>
          </div>
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <PrimaryButton type="submit" fullWidth loading={loading}>
            Registrarse
          </PrimaryButton>
        </form>

        <p className={styles.loginHint}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className={styles.link}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
