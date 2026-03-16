# Autenticación

El frontend soporta tres métodos de login: email/password, Google OAuth y LinkedIn OAuth.
Todos producen tokens JWT que se almacenan en localStorage.

---

## Flujo de autenticación

### Email / Password

```
Usuario         Frontend              Backend
   │──── POST /api/auth/login/ ──────▶│
   │◀─── { access, refresh, user } ───│
   │
   │  localStorage.setItem('access_token', ...)
   │  localStorage.setItem('refresh_token', ...)
   │  AuthContext.user = userData
```

### Google OAuth

```
Usuario         Frontend                    Backend            Google
   │─── clic "Iniciar con Google" ──▶│
   │                                  │──── OAuth consent ──▶│
   │                                  │◀─── code/token ───────│
   │                                  │── POST /api/auth/social/google/ ─▶│
   │                                  │◀─── { access, refresh, user } ───│
   │◀─── redirect a /home ────────────│
```

El componente `GoogleSignInButton` usa `@react-oauth/google`. El backend recibe
el token de Google, verifica con la API de Google, crea o busca el usuario, y devuelve JWT.

### LinkedIn OAuth (PKCE)

Similar a Google pero vía redirect: el backend redirige al callback de LinkedIn,
que a su vez redirige al frontend con los tokens en query params (`/auth/callback`).
El componente `AuthCallback` procesa los params y llama a `completeSocialLogin()`.

---

## Almacenamiento de tokens

| Key localStorage | Contenido |
|-----------------|-----------|
| `access_token` | JWT de acceso (corta duración, ~1h) |
| `refresh_token` | JWT de refresh (larga duración, ~24h) |
| `user` | Objeto JSON con `id, email, first_name, last_name, is_staff` |

---

## Refresh automático de tokens

`AuthContext` configura un interceptor de respuesta en Axios:

```
Request sale → interceptor añade Authorization: Bearer <access_token>
         ↓
Response llega con 401
         ↓
Interceptor intenta POST /api/auth/token/refresh/ con refresh_token
         ↓
¿Éxito? → guarda nuevo access_token, reintenta el request original
¿Fallo? → logout() + navigate('/login')
```

Se usa `isRefreshing` + cola de requests pendientes para evitar múltiples
refresh simultáneos cuando varios requests fallan al mismo tiempo.

---

## Tipo User

```typescript
interface User {
  id: number
  email: string
  first_name?: string
  last_name?: string
  is_staff?: boolean
  profile_photo?: string | null
}
```

`is_staff: true` habilita el acceso al panel de Admin.

---

## Hook useAuth()

```typescript
const {
  user,                  // User | null
  accessToken,           // string | null
  loginWithEmail,        // (email, password) => Promise<void>
  loginWithGoogle,       // (googleToken) => Promise<void>
  completeSocialLogin,   // (access, refresh, userData?) => void
  logout,                // () => void
  refreshAccessToken,    // () => Promise<string | null>
} = useAuth()
```

---

## Rutas

### Públicas (sin auth)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Landing | Página de inicio |
| `/login` | Login | Formulario email/password + botones OAuth |
| `/login/recuperar-contrasena` | ForgotPassword | Solicitar reset |
| `/login/restablecer-contrasena` | ResetPassword | Ingresar nueva contraseña con token |
| `/registro` | Register | Registro de nuevo usuario |
| `/auth/callback` | AuthCallback | Callback OAuth (LinkedIn) |

### Protegidas (requieren accessToken)

Todas las demás rutas usan `ProtectedLayout`, que verifica `accessToken`:

```typescript
const ProtectedLayout = () => {
  const { accessToken } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  return <Layout><Outlet /></Layout>
}
```

Rutas de `/admin/*` adicionalmente requieren `user.is_staff === true`.

---

## CSRF

El backend requiere CSRF en requests no-GET. El frontend:
1. Hace `GET /api/auth/social/csrf/` para obtener el cookie `mdc_csrftoken`
2. El interceptor de Axios lee ese cookie y lo añade como header `X-CSRFToken`

---

## Testing local sin Google OAuth

Para desarrollo sin credenciales de Google:

```javascript
// En la consola del navegador (con el servidor de backend corriendo):
// 1. Obtener token via API
fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
}).then(r => r.json()).then(data => {
  localStorage.setItem('access_token', data.access)
  localStorage.setItem('refresh_token', data.refresh)
  localStorage.setItem('user', JSON.stringify(data.user))
  location.reload()
})
```
