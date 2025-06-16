import React from 'react';

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ReportConfiguration {
  page_size: string;
  orientation: string;
  margins: Margins;
  header_text: string;
  header_font_size: number;
  header_font_style: string;
  footer_text: string;
  footer_font_size: number;
  footer_font_style: string;
  show_page_numbers: boolean;
  page_number_position: string;
  // ...otros campos si necesitas
}

interface PrintPreviewLayoutProps {
  config: ReportConfiguration;
  children: React.ReactNode; // El contenido del reporte (en bruto)
}

const fontStyle = (style: string) => {
  let fontWeight = 'normal';
  let fontStyle = 'normal';
  if (style.includes('bold')) fontWeight = 'bold';
  if (style.includes('italic')) fontStyle = 'italic';
  return { fontWeight, fontStyle };
};

export const PrintPreviewLayout: React.FC<PrintPreviewLayoutProps> = ({ config, children }) => {
  const { margins, header_text, header_font_size, header_font_style, footer_text, footer_font_size, footer_font_style, show_page_numbers, page_number_position } = config;

  return (
    <div
      style={{
        width: config.page_size === 'A4' ? 794 : 816, // px aprox para A4/Letter
        minHeight: config.page_size === 'A4' ? 1123 : 1056,
        margin: '0 auto',
        background: '#fff',
        boxShadow: '0 0 8px #ccc',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
        padding: 0,
      }}
    >
      {/* Encabezado */}
      <div
        style={{
          position: 'absolute',
          top: margins.top,
          left: margins.left,
          right: margins.right,
          fontSize: header_font_size,
          ...fontStyle(header_font_style),
        }}
      >
        {header_text}
      </div>

      {/* Contenido principal */}
      <div
        style={{
          marginTop: margins.top + 40,
          marginBottom: margins.bottom + 40,
          marginLeft: margins.left,
          marginRight: margins.right,
          flex: 1,
        }}
      >
        {children}
      </div>

      {/* Pie de página */}
      <div
        style={{
          position: 'absolute',
          bottom: margins.bottom,
          left: margins.left,
          right: margins.right,
          fontSize: footer_font_size,
          ...fontStyle(footer_font_style),
        }}
      >
        {footer_text}
      </div>

      {/* Número de página (solo ejemplo, página 1) */}
      {show_page_numbers && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: page_number_position === 'bottom_left' ? margins.left : page_number_position === 'bottom_center' ? '50%' : undefined,
            right: page_number_position === 'bottom_right' ? margins.right : undefined,
            transform: page_number_position === 'bottom_center' ? 'translateX(-50%)' : undefined,
            fontSize: 12,
            color: '#888',
          }}
        >
          Página 1
        </div>
      )}
    </div>
  );
};