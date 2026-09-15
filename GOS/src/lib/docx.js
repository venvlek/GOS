import mammoth from 'mammoth';

// Converts an uploaded .docx File into HTML for in-app display.
// window.storage only holds text/JSON, so we keep the extracted HTML
// (not the raw binary) — see the README for why.
export async function readDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return { html: result.value, warnings: result.messages };
}
