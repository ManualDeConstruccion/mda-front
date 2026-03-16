# Documentación — MDA Frontend (mda-front)

Cliente React para el sistema de gestión de proyectos arquitectónicos chilenos MDA.

**Backend:** [mdc](https://github.com/ManualDeConstruccion/mdc) —
API REST en `http://localhost:8000/api/`. Ver `mdc/docs/` para contratos de API y modelos.

---

## Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [architecture/overview.md](architecture/overview.md) | Stack, estructura de carpetas, decisiones de diseño |
| [architecture/state-management.md](architecture/state-management.md) | AuthContext vs React Query: cuándo usar cada uno |

## Features

| Documento | Descripción |
|-----------|-------------|
| [features/auth.md](features/auth.md) | Flujo OAuth → JWT → localStorage → interceptores |
| [features/forms.md](features/forms.md) | Sistema de formularios dinámicos y método CAM |
| [features/project-tree.md](features/project-tree.md) | Árbol de nodos: componentes, hooks, drag-drop |

## Componentes

| Documento | Descripción |
|-----------|-------------|
| [components/overview.md](components/overview.md) | Catálogo de componentes reutilizables |

## API / Servicios

| Documento | Descripción |
|-----------|-------------|
| [api/services.md](api/services.md) | Capa de servicios: Axios, interceptores, llamadas principales |

## Guías

| Documento | Descripción |
|-----------|-------------|
| [guides/setup.md](guides/setup.md) | Setup local, variables de entorno, troubleshooting |
| [guides/testing.md](guides/testing.md) | Vitest: convenciones y cómo correr tests |
