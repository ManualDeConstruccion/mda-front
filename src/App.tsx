import React from "react";
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

// ↳ Contextos y páginas
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import PublicLayout from "./components/Layout/PublicLayout";
import Home from "./pages/Home";
import Login from "./pages/Login/Login";
import Landing from "./pages/Landing/Landing";
import CreateProject from "./pages/Projects/CreateProject";
import ProjectList from "./pages/Projects/ProjectList";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import CreateArchitectureProject from "./pages/ArchitectureProjects/CreateArchitectureProject";
import ArchitectureProjectDetail from "./pages/ArchitectureProjects/ArchitectureProjectDetail";
import EditArchitectureProject from "./pages/ArchitectureProjects/EditArchitectureProject";
import { FormNodeProvider } from './context/FormNodeContext';
import SelectorFormPage from './pages/Forms/Step1SelectorFormPage';
import Step2NodeFormCreatePage from './pages/Forms/Step2NodeFormCreatePage';
import Step3FormPage from './pages/Forms/Step3FormPage';

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
                      </Route>
                    </Route>

                    {/* Rutas para formularios */}
                    <Route path="form/select" element={<SelectorFormPage />} />
                    <Route path="form/node/:mode/:id?" element={<Step2NodeFormCreatePage />} />
                    <Route path="/form/:formTypeModel/:nodeId" element={<Step3FormPage />} />
                  </Route>

                  {/* fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </FormNodeProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
