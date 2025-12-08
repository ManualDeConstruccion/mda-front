import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { GoogleOAuthProvider } from "@react-oauth/google";
import theme from "./utils/theme";

// ↳ Contextos (siempre necesarios)
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FormNodeProvider } from './context/FormNodeContext';
import Layout from "./components/Layout/Layout";
import PublicLayout from "./components/Layout/PublicLayout";

// ↳ Lazy loading de páginas (solo se cargan cuando se necesitan)
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login/Login"));
const Landing = lazy(() => import("./pages/Landing/Landing"));
const CreateProject = lazy(() => import("./pages/Projects/CreateProject"));
const ProjectList = lazy(() => import("./pages/Projects/ProjectList"));
const ProjectDetail = lazy(() => import("./pages/Projects/ProjectDetail"));
const CreateArchitectureProject = lazy(() => import("./pages/ArchitectureProjects/CreateArchitectureProject"));
const ArchitectureProjectDetail = lazy(() => import("./pages/ArchitectureProjects/ArchitectureProjectDetail"));
const EditArchitectureProject = lazy(() => import("./pages/ArchitectureProjects/EditArchitectureProject"));
const SurfaceEditor = lazy(() => import("./pages/ArchitectureProjects/SurfaceEditor"));
const SelectorFormPage = lazy(() => import('./pages/Forms/Step1SelectorFormPage'));
const Step2NodeFormCreatePage = lazy(() => import('./pages/Forms/Step2NodeFormCreatePage'));
const Step3FormPage = lazy(() => import('./pages/Forms/Step3FormPage'));
const FormReportView = lazy(() => import('./pages/Forms/FormReportView'));
const ReportConfigurationForm = lazy(() => import('./pages/ReportConfiguration/ReportConfigurationForm'));
const ReportConfigurationPage = lazy(() => import('./pages/ReportConfiguration/ReportConfigurationPage'));

// Componente de carga (fallback)
const LoadingFallback: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Cargando...
  </div>
);

/** ────────────────────────────────────────────────────────────────────────────
 *  🎛️  React‑Query client (sin refetch on focus)
 * ───────────────────────────────────────────────────────────────────────────*/
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

/** ────────────────────────────────────────────────────────────────────────────
 *  🔐  Layout protegido + outlet
 *      ‣ Encapsula <Layout/> y aplica autenticación en un solo lugar
 * ───────────────────────────────────────────────────────────────────────────*/
const ProtectedLayout: React.FC = () => {
  const { accessToken } = useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  return (
    <Layout>
      {/*  Todas las rutas hijas se renderizarán aquí */}
      <Outlet />
    </Layout>
  );
};

// Verificar que la variable de entorno esté definida
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!googleClientId) {
  console.error('VITE_GOOGLE_CLIENT_ID no está definida en el archivo .env');
}

const App: React.FC = () => {
  if (!googleClientId) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Error de configuración</h1>
        <p>El ID de cliente de Google no está configurado.</p>
        <p>Agrega VITE_GOOGLE_CLIENT_ID al archivo .env y reinicia.</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <AuthProvider>
              <FormNodeProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* ───────── Public ‐‐ landing y login ───────── */}
                    <Route
                      path="/"
                      element={
                        <PublicLayout>
                          <Landing />
                        </PublicLayout>
                      }
                    />
                    <Route path="/login" element={<Login />} />

                    {/* ───────── Protected ‐‐ todo lo demás ───────── */}
                    <Route element={<ProtectedLayout />}>
                      <Route path="home" element={<Home />} />

                      {/*  Agrupamos las rutas de proyectos  */}
                      <Route path="proyectos">
                        {/* /proyectos/crear */}
                        <Route path="crear" element={<CreateProject />} />

                        {/* /proyectos/lista */}
                        <Route path="lista" element={<ProjectList />} />

                        {/* /proyectos/:projectId  */}
                        <Route path=":projectId" element={<ProjectDetail />} />

                        {/* /proyectos/:projectId/arquitectura/*  */}
                        <Route path=":projectId/arquitectura">
                          {/* /proyectos/:projectId/arquitectura/crear */}
                          <Route path="crear" element={<CreateArchitectureProject />} />

                          {/* /proyectos/:projectId/arquitectura/:architectureId */}
                          <Route path=":architectureId" element={<ArchitectureProjectDetail />} />

                          {/* /proyectos/:projectId/arquitectura/:architectureId/editar */}
                          <Route path=":architectureId/editar" element={<EditArchitectureProject />} />

                          {/* /proyectos/:projectId/arquitectura/:architectureId/superficies */}
                          <Route path=":architectureId/superficies" element={<SurfaceEditor />} />
                        </Route>
                      </Route>

                      {/* Rutas para formularios */}
                      <Route path="form/select" element={<SelectorFormPage />} />
                      <Route path="form/node/:mode/:id?" element={<Step2NodeFormCreatePage />} />
                      <Route path="/form/:formTypeModel/:nodeId" element={<Step3FormPage />} />
                      <Route path="form/:formTypeModel/:nodeId/informe" element={<FormReportView />} />
                      <Route path="/herramientas/configuracion-informes" element={<ReportConfigurationPage />} />
                      <Route path="/herramientas/configuracion-informes/:nodeId" element={<ReportConfigurationForm />} />
                    </Route>

                    {/* fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </FormNodeProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
