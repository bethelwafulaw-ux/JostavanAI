/**
 * Preview Renderer v3.0
 * Uses direct HTML generation from website templates
 * Falls back to JSX parsing only when needed
 */

export interface PreviewFile {
  path: string;
  content: string;
  language: string;
}

// Store the last generated preview HTML from the website generator
let _directPreviewHTML: string | null = null;

export function setDirectPreviewHTML(html: string | null) {
  _directPreviewHTML = html;
}

export function getDirectPreviewHTML(): string | null {
  return _directPreviewHTML;
}

// Main function - prioritizes direct HTML, falls back to parsing
export function generatePreviewHTML(files: PreviewFile[], _projectType: string = 'landing'): string {
  // If we have direct preview HTML from the generator, use it
  if (_directPreviewHTML) {
    return _directPreviewHTML;
  }

  // Fallback: try to extract content from files
  const indexCss = files.find(f => f.path.includes('index.css'));
  const appFile = files.find(f => f.path.includes('App.tsx') || f.path.includes('App.jsx'));

  let styles = '';
  if (indexCss?.content) {
    const cssVarsMatch = indexCss.content.match(/:root\s*\{([^}]+)\}/);
    if (cssVarsMatch) {
      styles = `:root { ${cssVarsMatch[1]} }`;
    }
  }

  // Try to find the main page file and extract JSX
  const pageFiles = files.filter(f =>
    f.path.includes('/pages/') ||
    f.path.toLowerCase().includes('landing') ||
    f.path.toLowerCase().includes('home')
  );

  let bodyContent = '';
  for (const pageFile of pageFiles) {
    if (pageFile.content && pageFile.content.length > 100) {
      const jsx = extractJSXFromComponent(pageFile.content);
      if (jsx && jsx.length > 50) {
        bodyContent = simpleJsxToHtml(jsx);
        break;
      }
    }
  }

  if (!bodyContent || bodyContent.length < 50) {
    return generateEmptyPreview();
  }

  return wrapInTemplate(bodyContent, styles);
}

function extractJSXFromComponent(content: string): string | null {
  const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*(?:}|$)/);
  if (returnMatch) return returnMatch[1].trim();
  return null;
}

function simpleJsxToHtml(jsx: string): string {
  let html = jsx;
  html = html.replace(/className=/g, 'class=');
  html = html.replace(/\s+onClick=\{[^}]+\}/g, '');
  html = html.replace(/\s+onChange=\{[^}]+\}/g, '');
  html = html.replace(/\s+onSubmit=\{[^}]+\}/g, '');
  html = html.replace(/\s+ref=\{[^}]+\}/g, '');
  html = html.replace(/\s+key=\{[^}]+\}/g, '');
  html = html.replace(/=\{`([^`]+)`\}/g, '="$1"');
  html = html.replace(/=\{"([^"]+)"\}/g, '="$1"');
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  html = html.replace(/\{[^}]*\}/g, '');
  return html;
}

function wrapInTemplate(bodyContent: string, styles: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script><style>${styles} * { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: system-ui, -apple-system, sans-serif; }</style></head><body>${bodyContent}</body></html>`;
}

function generateEmptyPreview(): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"><div class="text-center p-8 max-w-md"><div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25"><svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg></div><h2 class="text-2xl font-bold text-gray-900 mb-3">Ready to Build</h2><p class="text-gray-600 mb-6">Tell the AI what you want to create and it will generate your website. The preview will update automatically.</p><div class="flex items-center justify-center gap-2 text-sm text-gray-500"><span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>AI Builder Ready</div></div></body></html>`;
}

export function createPreviewBlobURL(html: string): string {
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

export function revokePreviewBlobURL(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
