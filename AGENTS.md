# AGENTS.md

## Overview

Frontend React para MDA (Manual de Arquitectura) — sistema de gestión de proyectos
arquitectónicos chilenos (formularios MINVU, normativa OGUC/LGUC, permisos de obra).

El backend correspondiente está en el repo `mdc` y expone su API en `http://localhost:8000/api/`.

---

## Services

| Servicio | Puerto | Cómo correr |
|----------|--------|-------------|
| React (Vite) | 3000 | `npm run dev` |
| Backend Django | 8000 | ver `mdc/AGENTS.md` |

---

## Setup inicial

```bash
npm install
cp .env.example .env          # ajustar VITE_API_URL
npm run dev
```

Variables de entorno necesarias en `.env`:

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<tu-client-id>
```

---

## Key gotchas

- **Auth local sin Google OAuth**: inyectar tokens JWT en localStorage para saltear
  el flujo OAuth. Obtener un token via `POST /api/auth/login/` en el backend, luego
  `localStorage.setItem('access_token', '<token>')` y recargar la app.
- **CORS**: el backend debe tener `http://localhost:3000` en `CORS_ALLOWED_ORIGINS`
  (configurado en `mdc/buildguide/settings/local.py`).
- **React Query caché**: en desarrollo, el staleTime por defecto es 0; los datos se
  refetchean al volver a la ventana. Ajustar en `queryClient` si molesta durante el debug.
- **TypeScript strict**: el proyecto usa `strict: true`. No usar `any` sin justificación.
- **Vitest**: correr tests con `npm test`. Los test files van junto al archivo que testean
  (`Component.test.tsx` al lado de `Component.tsx`).
- **Build**: `npm run build` ejecuta `tsc` primero — errores de tipos rompen el build.
  Resolver todos antes de hacer merge.
- **MUI theme**: el theme global está en `src/utils/theme.ts`. No usar colores hardcodeados;
  usar `theme.palette.*` o los tokens de MUI.

---

## Estructura del proyecto

```
src/
├── components/    # Componentes reutilizables (ver docs/components/overview.md)
├── pages/         # Páginas/rutas (ver docs/features/)
├── hooks/         # Custom hooks — prefijo `use`, un hook por archivo
├── services/      # api.ts + funciones de llamada al backend
├── context/       # AuthContext (JWT + user state)
├── types/         # Interfaces TypeScript compartidas
├── validation/    # Schemas Yup
├── mappers/       # Transformaciones de datos API ↔ UI
└── utils/         # Helpers, theme, constantes
```

---

## Documentation protocol

Cada cambio de código incluye su documentación en el mismo commit.
Ver `.cursor/rules/documentation.mdc` para el protocolo completo. Resumen:

| Cambio | Archivo a actualizar |
|--------|---------------------|
| Componente reutilizable | `docs/components/overview.md` |
| Página / feature | `docs/features/<feature>.md` |
| Hook con patrón nuevo | `docs/architecture/state-management.md` |
| Llamada a la API | `docs/api/services.md` |
| Cambio de auth o rutas | `docs/features/auth.md` |
| Decisión de diseño | `docs/architecture/overview.md` |
| Gotcha de desarrollo | este archivo (`AGENTS.md`) |
| Todo lo anterior | `CHANGELOG.md` bajo `[Unreleased]` |

---

## Referencia cruzada con el backend

- Documentación del backend: `mdc/docs/`
- Contratos de API: `mdc/docs/api/`
- Modelos de datos: `mdc/docs/features/`
- Swagger (con backend corriendo): `http://localhost:8000/swagger/`
