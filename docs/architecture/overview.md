# Arquitectura del frontend

## Stack

| Tecnología | Versión | Rol |
|------------|---------|-----|
| React | 18.2 | UI framework |
| TypeScript | strict | Tipado estático |
| Vite | 5 | Build tool + dev server |
| React Router DOM | 6.30 | Routing |
| MUI (Material-UI) | 5.17 | Componentes UI y sistema de diseño |
| React Query (@tanstack) | 5.17 | Data fetching, caché, sincronización |
| Axios | 1.8 | Cliente HTTP con interceptores |
| @dnd-kit | 6.3 | Drag-and-drop accesible |
| Yup | 1.7 | Validación de schemas |
| jwt-decode | 4.0 | Decodificación de tokens JWT |
| @react-oauth/google | 0.12 | Google OAuth integration |

---

## Estructura de carpetas

```
src/
├── App.tsx                 # Providers, router, rutas
├── context/
│   ├── AuthContext.tsx     # JWT + user state (fuente de verdad de auth)
│   ├── ProjectContext.tsx  # ID del proyecto activo
│   └── FormNodeContext.tsx # Estado del wizard de creación de formularios
├── services/
│   └── api.ts             # Instancia Axios + interceptores base
├── hooks/
│   ├── useProjectNodes.ts  # CRUD + reordenamiento de nodos
│   ├── useFloors.ts        # Pisos y niveles
│   ├── useCAMApi.ts (FormHooks/)  # API completa de protección al fuego
│   └── ...25 hooks más     # Ver docs/architecture/state-management.md
├── pages/
│   ├── Projects/           # Lista, detalle, creación
│   ├── ArchitectureProjects/  # Sub-proyectos de arquitectura
│   ├── Forms/              # Wizard de formularios dinámicos
│   └── Admin/              # Panel admin (solo is_staff)
├── components/
│   ├── Admin/              # Editor de plantillas, grilla de parámetros
│   ├── Layout/             # Layout, Navbar, Sidebar
│   ├── common/             # Componentes reutilizables (inputs, modales, etc.)
│   └── ...                 # Ver docs/components/overview.md
├── types/
│   ├── project_nodes.types.ts
│   ├── formParameters.types.ts
│   ├── cam.types.ts
│   └── ...
├── validation/             # Schemas Yup
├── mappers/                # Transformaciones de datos API ↔ UI
└── utils/
    └── theme.ts            # MUI theme global
```

---

## Jerarquía de providers (App.tsx)

```
GoogleOAuthProvider       ← habilita Google OAuth
  QueryClientProvider     ← React Query (refetchOnWindowFocus: false, retry: 1)
    ThemeProvider         ← MUI theme global (src/utils/theme.ts)
      Router              ← React Router
        AuthProvider      ← JWT + user (lee/escribe localStorage)
          FormNodeProvider ← estado wizard formularios
```

---

## Decisiones de diseño

### MUI como sistema de diseño
MUI provee un sistema de componentes y tokens de diseño consistente. No usar colores
hardcodeados; usar siempre `theme.palette.*` para garantizar consistencia visual y
facilitar cambios futuros.

### React Query como capa de datos
Todo dato del servidor vive en el caché de React Query, no en state local ni en Context.
El Context solo guarda estado de UI (auth, proyecto activo, wizard). Ver
[state-management.md](state-management.md) para la división exacta.

### @dnd-kit para drag-and-drop
Elegido sobre react-beautiful-dnd por ser accesible, moderno, y sin dependencias de
ReactDOM.findDOMNode. Usado para reordenar nodos de proyecto y capas de soluciones CAM.

### TypeScript strict
`strict: true` en `tsconfig.json`. Los errores de tipo rompen el build (`npm run build`).
No usar `any` salvo cuando sea absolutamente necesario y con comentario justificando el motivo.

---

## Routing

Hay dos layouts:
- **`PublicLayout`** — landing, login, registro, OAuth callback (sin autenticación)
- **`ProtectedLayout`** — todas las rutas de la app (requiere `accessToken`)

`ProtectedLayout` redirecciona a `/login` si no hay token. Las rutas de Admin
adicionalmente verifican `user.is_staff`.

Ver rutas completas en [features/auth.md](../features/auth.md#rutas).
