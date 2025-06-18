import React, { useEffect, useRef } from 'react';

interface PagedPreviewProps {
  /** Contenido HTML ya formateado y con estilos embebidos */
  html: string;
}

const PagedPreview: React.FC<PagedPreviewProps> = ({ html }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;

    const renderPreview = async () => {
      try {
        // Limpia contenido previo solo una vez
        containerRef.current!.innerHTML = '';

        // Carga dinámica de Paged.js
        const Paged = await import('pagedjs');
        
        // Limpiamos el previewer anterior si existe
        if (previewerRef.current) {
          containerRef.current!.innerHTML = '';
        }

        // Creamos nuevo previewer
        previewerRef.current = new Paged.Previewer();

        // Creamos un contenedor temporal para el HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        
        // Log del HTML generado
        console.log('HTML generado para PagedPreview:', html);

        // Añadimos el contenido al contenedor principal
        containerRef.current!.appendChild(tempContainer);

        // Esperamos a que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 0));

        // Iniciamos el render paginado
        await previewerRef.current.preview(containerRef.current!, []);
      } catch (err) {
        console.error('Error cargando Paged.js:', err);
      }
    };

    renderPreview();

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      previewerRef.current = null;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '16px',
        background: '#f5f5f5',
        minHeight: '100%'
      }}
    />
  );
};

export default PagedPreview;
