export const PDF_PREVIEW_CLASSNAME = 'pdf-preview';

export function getPrintCSS(config: any) {
  let width, height;
  if (config.page_size === 'custom') {
    width = `${config.custom_page_width || 210}mm`;
    height = `${config.custom_page_height || 297}mm`;
  } else if (config.page_size?.toLowerCase() === 'oficio') {
    width = '216mm';
    height = '330mm';
  } else if (config.page_size?.toLowerCase() === 'legal') {
    width = '216mm';
    height = '356mm';
  } else if (config.page_size?.toLowerCase() === 'letter') {
    width = '216mm';
    height = '279mm';
  } else {
    width = '210mm';
    height = '297mm';
  }
  const orientation = config.orientation === 'landscape' ? `${height} ${width}` : `${width} ${height}`;
  const margins = config.get_margins
    ? config.get_margins()
    : { top: 20, right: 20, bottom: 20, left: 20 };
  return `
    @page {
      size: ${orientation};
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    html, body {
      background: transparent !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100%;
      height: 100%;
    }
    .${PDF_PREVIEW_CLASSNAME} {
      width: ${width};
      height: ${height};
      margin: 0 auto;
      background: #fff;
      box-sizing: border-box;
      font-family: 'Roboto', Arial, sans-serif;
      /* Los márgenes internos los da @page, no padding aquí */
    }
  `;
}

export const PDF_FONTS_LINKS = [
  '<link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet">',
  // Agrega aquí otros links de fuentes si los necesitas
]; 