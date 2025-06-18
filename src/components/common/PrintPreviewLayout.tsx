import React from 'react';
import { PDF_PREVIEW_CLASSNAME } from '../../utils/printCss';

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ReportConfiguration {
  // Campos de página
  page_size: 'A4' | 'letter' | 'legal' | 'oficio' | 'custom';
  custom_page_width?: number;
  custom_page_height?: number;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  
  // Configuración de logo
  logo?: string;
  logo_position: 'left' | 'center' | 'right';
  logo_size: 'small' | 'medium' | 'large';
  
  // Configuración de encabezado
  header_text?: string;
  header_font_size: number;
  header_font_style: 'normal' | 'bold' | 'italic';
  
  // Configuración de pie de página
  footer_text?: string;
  footer_font_size: number;
  footer_font_style: 'normal' | 'bold' | 'italic';
  
  // Configuración de números de página
  show_page_numbers: boolean;
  page_number_position: 'bottom_center' | 'bottom_right' | 'bottom_left';
}

interface PrintPreviewLayoutProps {
  config: ReportConfiguration;
  children: React.ReactNode;
}

// Constantes para conversión de unidades
const MM_TO_PX = 96 / 25.4; // 96 DPI / 25.4 mm por pulgada
const PAGE_SIZES_MM = {
  'A4': { width: 210, height: 297 },
  'letter': { width: 216, height: 279 },
  'legal': { width: 216, height: 356 },
  'oficio': { width: 216, height: 330 }
};

const mmToPx = (mm: number): number => Math.round(mm * MM_TO_PX);

const getPageDimensions = (config: ReportConfiguration) => {
  let size;
  if (config.page_size === 'custom' && config.custom_page_width && config.custom_page_height) {
    size = {
      width: config.custom_page_width,
      height: config.custom_page_height
    };
  } else {
    const mmSize = PAGE_SIZES_MM[config.page_size as keyof typeof PAGE_SIZES_MM] || PAGE_SIZES_MM['A4'];
    size = {
      width: mmSize.width,
      height: mmSize.height
    };
  }
  
  if (config.orientation === 'landscape') {
    return {
      width: size.height,
      height: size.width
    };
  }
  
  return size;
};

const getLogoSize = (size: string) => {
  // Convertir tamaños de logo a milímetros y luego a píxeles
  const sizes = {
    'small': { width: 25, height: 25 },  // 25mm x 25mm
    'medium': { width: 40, height: 40 }, // 40mm x 40mm
    'large': { width: 60, height: 60 }   // 60mm x 60mm
  };
  
  const mmSize = sizes[size as keyof typeof sizes] || sizes.medium;
  return {
    width: mmToPx(mmSize.width),
    height: mmToPx(mmSize.height)
  };
};

export const PrintPreviewLayout: React.FC<PrintPreviewLayoutProps> = ({ config, children }) => {
  const dimensions = getPageDimensions(config);
  const logoSize = getLogoSize(config.logo_size);
  const margins = config.margins;

  // CSS para header y footer como running elements
  const pagedHeaderFooterCss = `
    .header {
      position: running(header);
      width: 100%;
      text-align: center;
      font-size: ${config.header_font_size || 14}px;
      color: #222;
      ${config.header_font_style === 'bold' ? 'font-weight: bold;' : ''}
      ${config.header_font_style === 'italic' ? 'font-style: italic;' : ''}
      ${config.header_text ? '' : 'min-height: 1em;'}
      height: 0;
      overflow: hidden;
    }
    .footer {
      position: running(footer);
      width: 100%;
      text-align: center;
      font-size: ${config.footer_font_size || 12}px;
      color: #444;
      ${config.footer_font_style === 'bold' ? 'font-weight: bold;' : ''}
      ${config.footer_font_style === 'italic' ? 'font-style: italic;' : ''}
      ${config.footer_text ? '' : 'min-height: 1em;'}
      height: 0;
      overflow: hidden;
    }
    ${config.show_page_numbers ? `
      .footer::after {
        content: "${config.footer_text ? config.footer_text + ' — ' : ''}Página " counter(page) " de " counter(pages);
      }
    ` : config.footer_text ? `
      .footer::after {
        content: "${config.footer_text}";
      }
    ` : ''}
    @page {
      @top-center {
        content: element(header);
      }
      @bottom-center {
        content: element(footer);
      }
    }
  `;

  return (
    <div
      className={PDF_PREVIEW_CLASSNAME}
      style={{
        width: `${dimensions.width}mm`,
        height: `${dimensions.height}mm`,
        background: '#fff',
        position: 'relative',
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'block',
      }}
    >
      {/* CSS global para header y footer paginados */}
      <style>{pagedHeaderFooterCss}</style>
      <div
        style={{
          position: 'absolute',
          top: `${margins.top}mm`,
          left: `${margins.left}mm`,
          right: `${margins.right}mm`,
          bottom: `${margins.bottom}mm`,
          width: `calc(100% - ${margins.left + margins.right}mm)`,
          height: `calc(100% - ${margins.top + margins.bottom}mm)`,
          boxSizing: 'border-box',
          overflow: 'visible',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header y Footer como running elements al inicio del flujo */}
        <div className="header">{config.header_text}</div>
        <div className="footer" />
        {/* Logo (opcional) */}
        {config.logo && (
          <div
            style={{
              position: 'relative',
              top: 0,
              left: config.logo_position === 'left' ? 0 : undefined,
              right: config.logo_position === 'right' ? 0 : undefined,
              textAlign: config.logo_position === 'center' ? 'center' : 'left',
              width: config.logo_position === 'center' ? '100%' : 'auto',
            }}
          >
            <img 
              src={config.logo} 
              alt="Logo" 
              style={{
                ...logoSize,
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
        )}
        {/* Contenido principal */}
        <div
          style={{
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};