import React from "react";
import { Link } from "react-router-dom";
import styles from "./Landing.module.scss";
import logo from "../../assets/images/logo-mda.png";

const Landing: React.FC = () => {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* ───── Hero / encabezado ───── */}
        <section className={styles.heroSection}>
          <div className={styles.logoContainer}>
            {/* Logo oficial de Manual de Arquitectura */}
            <img
              src={logo}
              alt="Logotipo Manual de Arquitectura (MDA)"
              className={styles.logoImage}
            />
          </div>

          <h1>Manual de Arquitectura</h1>
          <p className={styles.subtitle}>
            Centraliza trámites, controla entregables y mantente al día con la
            normativa —todo desde un solo lugar.
          </p>
        </section>

        {/* ───── Características ───── */}
        <section className={styles.features}>
          <h2>¿Qué ofrecemos?</h2>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <h3>Normativa al Día</h3>
              <p>
                Explora OGUC, Decretos y circulares con buscador inteligente,
                resaltado de cambios y enlaces cruzados. Trabaja siempre con la
                versión vigente.
              </p>
            </div>

            <div className={styles.featureCard}>
              <h3>Tramitación Guiada</h3>
              <p>
                Genera cada formulario con check‑lists automáticos, validaciones
                por IA y plantillas listas para que tu presentación en la DOM
                salga a la primera.
              </p>
            </div>

            <div className={styles.featureCard}>
              <h3>Alertas y Seguimiento</h3>
              <p>
                Activa notificaciones y monitorea en un panel el avance de tus
                permisos y recepciones.
              </p>
            </div>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section className={styles.cta}>
          <h2>Impulsa tu próximo proyecto con MDA</h2>
          <p>
            Crea tu cuenta gratuita y descubre cómo simplificamos cada paso del
            proceso constructivo.
          </p>

          <Link to="/home" className={styles.ctaButton}>
            Empezar ahora
          </Link>
        </section>
      </main>
    </div>
  );
};

export default Landing;
