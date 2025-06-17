import React, { useEffect, useRef } from 'react';

interface PagedIframePreviewProps {
  html: string; // HTML completo, con estilos y estructura
  style?: React.CSSProperties;
}

const PAGEDJS_CDN = 'https://unpkg.com/pagedjs/dist/paged.polyfill.js';

const PagedIframePreview: React.FC<PagedIframePreviewProps> = ({ html, style }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Escribe el HTML en el iframe
    iframe.srcdoc = html;

    // Espera a que el iframe cargue el contenido
    const onLoad = () => {
      const win = iframe.contentWindow;
      if (!win) return;

      // Inyecta el script de Paged.js
      const script = win.document.createElement('script');
      script.src = PAGEDJS_CDN;
      script.onload = () => {
        // Ejecuta la paginación cuando Paged.js esté listo
        // @ts-ignore
        if (win.Paged && win.Paged.Previewer) {
          // @ts-ignore
          new win.Paged.Previewer().preview();
        }
      };
      win.document.body.appendChild(script);
    };

    iframe.addEventListener('load', onLoad);

    // Limpieza
    return () => {
      iframe.removeEventListener('load', onLoad);
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        border: 'none',
        background: '#f5f5f5',
        ...style,
      }}
      title="Paged Preview"
    />
  );
};

export default PagedIframePreview;