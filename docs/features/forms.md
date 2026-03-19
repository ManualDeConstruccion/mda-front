# Formularios dinámicos

El sistema de formularios genera interfaces de entrada de datos a partir de la configuración
almacenada en el backend (`FormParameterCategory`, `FormParameter`, `FormCategoryBlock`).
Los formularios son completamente dinámicos: agregar o modificar campos en el backend
se refleja automáticamente en el frontend sin cambios de código.

---

## Flujo de creación (wizard 3 pasos)

```
Paso 1: /form/select
  └── El usuario elige el tipo de formulario (FormType)
      Estado guardado en FormNodeContext.selectedForm

Paso 2: /form/node/:mode/:id?
  └── Creación o selección del nodo de proyecto
      Estado guardado en FormNodeContext.nodeData

Paso 3: /form/:formTypeModel/:nodeId
  └── Ingreso de datos: formulario dinámico completo
      Datos enviados al backend via React Query mutations
```

---

## Estructura del formulario dinámico

Un formulario se divide en:

```
FormParameterCategory (sección, p.ej. "5. Datos de Arquitectura")
├── FormCategoryBlock (bloque de tipo "grilla" o "motor")
│   ├── FormParameter (campo de parámetro individual)
│   │   └── ParameterDefinition (define tipo, unidad, fuente de opciones)
│   └── FormGridCell (celda de texto/ayuda dentro de la grilla)
└── FormCategoryBlock de tipo "motor"
    └── SectionEngine (componente React especializado, p.ej. Superficies, Ocupación)
```

### Tipos de bloque (`block_type`)
- `"grid"` — grilla con parámetros y celdas de texto en posiciones (row, column, span)
- `"engine"` — motor de sección: componente React especializado que reemplaza la grilla

### Tipos de datos de parámetro (`data_type`)
`"text"`, `"decimal"`, `"integer"`, `"boolean"`, `"date"`, `"select"`, `"multiselect"`

### Fuentes de opciones (`options_source`)
Para `select` y `multiselect`: `"comunas"`, `"regiones"`, `"users"`, `"project_types"`, etc.
Ver `docs/features/option-sources.md` en el backend para la lista completa.

---

## Componentes clave

### SectionTreeWithModes

Componente central del formulario. Renderiza todas las secciones con soporte para 3 modos:

```typescript
<SectionTreeWithModes
  mode="view"      // Solo lectura
  mode="editable"  // El usuario puede ingresar valores
  mode="admin"     // Admin puede modificar la estructura del formulario
  nodeId={nodeId}
/>
```

En modo `admin`, la grilla de una sección muestra controles/acciones (agregar/quitar filas, insertar motor, eliminar, etc.)
solo en la fila activa. La fila activa se define al hacer click sobre algún elemento de la fila; el resto de filas se
renderiza con apariencia de `view` (sin botones de administración).

Además, en el modal **Editar Sección** (bloques), cada bloque puede:
- reordenarse por drag & drop,
- eliminarse,
- y **cambiar de sección** (selector de secciones del mismo tipo de proyecto), usando el endpoint backend de movimiento de bloques.

### Actualización diferida de templates PDF

Cuando se modifica `form_pdf_code` en admin, el cambio no reconstruye templates inmediatamente.
El frontend muestra badge en **Actualizar formularios**, abre una vista de comparación (old -> new),
y solo al confirmar **Aplicar cambios** dispara el rebuild asíncrono con seguimiento de estado.

### DynamicField

Renderiza el input correcto según el `data_type` del parámetro:

```typescript
<DynamicField
  parameterDefinition={param.parameter_definition}
  value={currentValue}
  onChange={(code, value) => handleChange(code, value)}
/>
```

### EngineBlockRenderer

Cuando un bloque es de tipo `"engine"`, este componente elige el componente React
correspondiente según `block.section_engine.code`:

| Código engine | Componente | Qué hace |
|--------------|-----------|---------|
| `superficies` | `SuperficiesSectionContent` | Editor de polígonos de superficie |
| `ocupacion` | `OcupacionSectionContent` | Cálculo de carga de ocupación |
| `propiedad` | `PropiedadSectionContent` | Datos del predio |
| `usuarios` | `UsuariosSectionContent` | Profesionales del proyecto |

---

## Formulario CAM (Protección contra Incendios)

El formulario del método CAM es el más complejo. Usa el hook `useCAMApi` (en
`src/hooks/FormHooks/useCAMApi.ts`) que encapsula toda la API de fire_protection.

### Flujo CAM

```
1. Usuario crea AnalyzedSolution (nombre + solución base opcional)
2. Agrega capas (material, espesor, densidad, coeficientes)
   → el backend recalcula automáticamente toda la cadena CAM
3. Crea ProposedSolution desde la base
4. Modifica capas de la propuesta para mejorar la resistencia
5. Compara base vs propuesta (F-XX resultante)
```

### useCAMApi

```typescript
const cam = useCAMApi()

// Soluciones analizadas
cam.useList(filters)                    // lista
cam.create(data)                        // crear
cam.addLayer(solutionId, layerData)     // agregar capa
cam.editLayer(layerId, data)            // editar capa
cam.deleteLayer(layerId)               // eliminar capa

// Propuestas
cam.proposed.solutions.createFromBase({ base_solution_id: N })
cam.proposed.layers.create(data)
```

---

## Validación

Los schemas de validación están en `src/validation/` usando Yup:

```typescript
import { object, string, number } from 'yup'

const schema = object({
  name: string().required('El nombre es obligatorio'),
  area: number().positive('Debe ser mayor a 0'),
})
```

Las validaciones se aplican antes de enviar al backend. Los errores del backend
(400 con `errors: { field: [messages] }`) se mapean a los campos del formulario.

---

## Generación de PDF

Desde cualquier formulario completado se puede generar un PDF MINVU:

```typescript
const { generatePDF, status, progress, downloadUrl } = usePDFGeneration()
await generatePDF(nodeId)  // polling cada 2s, timeout 5min
```

Estados: `idle → pending → processing → success | failed | timeout`

Ver [mdc/docs/features/blocks-engines.md](../../../mdc/docs/features/blocks-engines.md)
para la configuración de plantillas PDF en el backend.

---

### Admin: Importación de formulario desde PDF

En el panel admin (página `FormularioEditPage.tsx`) existe el wizard `PdfImportWizard` (4 pasos):

1. (Condicional) Si NO existe template activo para el tipo del formulario, se sube el PDF y se ingresa `form_code`.
   - Si SÍ existe template activo, el wizard salta Paso 1.
2. Ejecutar análisis visual con IA (Claude Vision) en background.
3. Revisar y editar el mapeo de `field_id` del PDF hacia `ParameterDefinition` (asignar existente / crear nuevo / ignorar).
4. Confirmar y aplicar: se crea/actualiza la estructura MDA (`FormParameterCategory`, `FormCategoryBlock`, `FormParameter`, `FormGridCell`) y se genera un PDF semántico.

**Persistencia:** el `jobId` del último análisis se guarda en `localStorage` por tipo de proyecto (`mda-pdf-import-job-{projectTypeId}`). Así puedes cerrar el modal y volver a abrirlo en el paso de revisión sin repetir el análisis (ahorra llamadas a la API de IA). Tras aplicar el import o con «Descartar borrador» se limpia. Si el job queda en error, el borrador se invalida solo.

Endpoints (backend): ver `mdc/docs/api/endpoints.md` (sección “Importación de Formularios desde PDF”).
