# Tests

El frontend usa **Vitest** como runner y **Testing Library** para renderizado de componentes.

---

## Correr tests

```bash
npm test              # modo watch (re-corre al guardar)
npm test -- --run     # una sola pasada (para CI)
npm test -- NombreArchivo  # filtrar por archivo
```

---

## Convenciones

### Ubicación

Los archivos de test van **junto al archivo que testean**:

```
src/components/common/FormInput/
  ├── FormInput.tsx
  └── FormInput.test.tsx   ← test aquí, no en carpeta separada
```

### Naming

```typescript
describe('FormInput', () => {
  it('muestra el label correctamente', () => { ... })
  it('muestra el mensaje de error cuando hay error', () => { ... })
  it('llama a onChange con el valor correcto', () => { ... })
})
```

Formato: `it('<hace qué> cuando <bajo qué condición>')`.

---

## Qué testear

### Componentes

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { FormInput } from './FormInput'

it('muestra mensaje de error', () => {
  render(<FormInput label="Nombre" name="name" error="Campo requerido" />)
  expect(screen.getByText('Campo requerido')).toBeInTheDocument()
})
```

Prioridad de tests para componentes:
1. Renderizado con props mínimas (smoke test)
2. Comportamiento con props de error/estado especial
3. Eventos de usuario (click, change) con `fireEvent` o `userEvent`

### Hooks

Usar `renderHook` para testear hooks aislados:

```typescript
import { renderHook } from '@testing-library/react'
import { useFieldHelpText } from './useFieldHelpText'

it('retorna el texto de ayuda para el código dado', async () => {
  const { result } = renderHook(() => useFieldHelpText('superficie_construida'))
  // ...
})
```

### Utilidades / Mappers

Testear como funciones puras:

```typescript
import { mapApiNodeToUI } from './nodeMapper'

it('convierte node_type a type correctamente', () => {
  const apiNode = { id: 1, node_type: { code: 'document' }, ... }
  expect(mapApiNodeToUI(apiNode).type).toBe('document')
})
```

---

## Mocks

### Mock de Axios

```typescript
import { vi } from 'vitest'
import { api } from '@/services/api'

vi.mock('@/services/api')
const mockApi = vi.mocked(api)

beforeEach(() => {
  mockApi.get.mockResolvedValue({ data: mockData })
})
```

### Mock de React Query

Envolver el componente bajo test en un `QueryClientProvider`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

render(<ComponenteConQuery />, { wrapper })
```

### Mock de AuthContext

```typescript
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', is_staff: false },
    accessToken: 'mock-token',
  }),
}))
```

---

## Lo que NO es necesario testear

- Estilos CSS/MUI (frágiles y de poco valor)
- Implementaciones internas de hooks de terceros
- Páginas completas de extremo a extremo (usar Cypress para eso si es necesario)
- Código generado automáticamente
