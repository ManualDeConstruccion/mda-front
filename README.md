# MDA Frontend

Este es el frontend de la aplicación MDA, desarrollado con React y TypeScript.

## 🚀 Tecnologías

- React 18
- TypeScript
- Material-UI
- React Router DOM
- Axios
- React Query

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas/rutas principales
├── services/      # Servicios para llamadas a la API
├── types/         # Definiciones de tipos TypeScript
├── utils/         # Funciones utilitarias
├── hooks/         # Custom hooks
├── context/       # Contextos de React
└── assets/        # Imágenes, iconos, etc.
```

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto y configura las variables de entorno necesarias:
```env
VITE_API_URL=http://localhost:8000
```

## 📦 Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm test`: Ejecuta los tests
- `npm run build`: Genera la versión de producción
- `npm run lint`: Ejecuta el linter
- `npm run format`: Formatea el código

## 🔗 Conexión con el Backend

Este frontend se conecta con una API REST desarrollada en Django. Asegúrate de que el backend esté corriendo antes de iniciar el frontend.

## 📝 Convenciones de Código

- Utilizamos ESLint y Prettier para mantener un estilo de código consistente
- Los componentes se nombran utilizando PascalCase
- Los archivos de utilidades y hooks utilizan camelCase
- Cada componente debe estar en su propio archivo
- Los tipos de TypeScript se definen en archivos `.d.ts` o `.types.ts`

## 👥 Contribución

1. Crea un branch para tu feature: `git checkout -b feature/nombre-feature`
2. Commit tus cambios: `git commit -m 'feat: agrega nuevo feature'`
3. Push al branch: `git push origin feature/nombre-feature`
4. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.
