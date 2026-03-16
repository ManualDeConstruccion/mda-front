# Setup local

## Requisitos

- Node.js 18+
- npm 9+
- Backend `mdc` corriendo en `http://localhost:8000` (ver `mdc/AGENTS.md`)

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de variables de entorno
cp .env.example .env
```

Editar `.env`:

```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<tu-google-client-id>
```

```bash
# 3. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Dev server con hot reload en puerto 3000 |
| `npm run build` | TypeScript check + build de producción |
| `npm run serve` | Preview del build de producción |
| `npm test` | Vitest en modo watch |

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base del backend | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth | — (opcional para dev) |

---

## Troubleshooting

### Error de CORS

```
Access to XMLHttpRequest at 'http://localhost:8000/...' blocked by CORS policy
```

El backend debe tener `http://localhost:3000` en `CORS_ALLOWED_ORIGINS`.
Verificar en `mdc/buildguide/settings/local.py`.

### 401 en todas las requests

El token de acceso expiró y el refresh falló. Solución:
1. Limpiar localStorage: `localStorage.clear()` en la consola
2. Recargar la página
3. Iniciar sesión nuevamente

### Google OAuth no funciona localmente

Sin las credenciales de Google, usar el método de email/password (ver `mdc/AGENTS.md`
sección "Frontend auth" para inyectar tokens JWT manualmente).

### Error de TypeScript en build

`npm run build` ejecuta TypeScript antes de compilar. Cualquier error de tipo
rompe el build. Resolver con:

```bash
npx tsc --noEmit  # muestra todos los errores de tipo sin compilar
```

### Puerto 3000 ocupado

Vite está configurado para usar el puerto 3000 (`--port 3000` en el script `dev`).
Matar el proceso que lo ocupa o cambiar el puerto en `package.json`.

---

## Configuración del IDE (recomendado)

### VSCode

Instalar extensiones:
- **ESLint** — linting en tiempo real
- **Prettier** — formateo automático
- **TypeScript** — soporte nativo

Configuración recomendada en `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```
