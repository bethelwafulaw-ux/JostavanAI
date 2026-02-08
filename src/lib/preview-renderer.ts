/**
 * Preview Renderer - Generates live HTML preview from actual React code
 * Parses JSX/TSX files and converts them to static HTML for iframe preview
 */

export interface PreviewFile {
  path: string;
  content: string;
  language: string;
}

// Base HTML template for preview
const getBaseTemplate = (bodyContent: string, styles: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
          },
        },
      },
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --primary: 221.2 83.2% 53.3%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96.1%;
      --secondary-foreground: 222.2 47.4% 11.2%;
      --muted: 210 40% 96.1%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96.1%;
      --accent-foreground: 222.2 47.4% 11.2%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --radius: 0.5rem;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
    }
    
    ${styles}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>
`;

// Extract CSS variables from index.css
function extractCSSVariables(cssContent: string): string {
  const cssVarsMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (cssVarsMatch) {
    return `:root { ${cssVarsMatch[1]} }`;
  }
  return '';
}

// Extract custom styles from CSS file (non-tailwind directives)
function extractCustomStyles(cssContent: string): string {
  return cssContent
    .replace(/@tailwind[^;]+;/g, '')
    .replace(/@layer\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/@import[^;]+;/g, '')
    .trim();
}

// Convert JSX className to class
function jsxToHtml(jsx: string): string {
  let html = jsx;
  
  // Replace className with class
  html = html.replace(/className=/g, 'class=');
  
  // Replace self-closing tags
  html = html.replace(/<(\w+)([^>]*)\s*\/>/g, '<$1$2></$1>');
  
  // Remove JSX expressions that are simple (like onClick handlers)
  html = html.replace(/\s+onClick=\{[^}]+\}/g, '');
  html = html.replace(/\s+onChange=\{[^}]+\}/g, '');
  html = html.replace(/\s+onSubmit=\{[^}]+\}/g, '');
  html = html.replace(/\s+onKeyDown=\{[^}]+\}/g, '');
  html = html.replace(/\s+onMouseEnter=\{[^}]+\}/g, '');
  html = html.replace(/\s+onMouseLeave=\{[^}]+\}/g, '');
  html = html.replace(/\s+ref=\{[^}]+\}/g, '');
  html = html.replace(/\s+key=\{[^}]+\}/g, '');
  
  // Handle simple JSX expressions in attributes
  html = html.replace(/=\{`([^`]+)`\}/g, '="$1"');
  html = html.replace(/=\{"([^"]+)"\}/g, '="$1"');
  html = html.replace(/=\{'([^']+)'\}/g, "='$1'");
  
  // Replace cn() calls with just the string
  html = html.replace(/class=\{cn\(([^)]+)\)\}/g, (match, args) => {
    const classes = args
      .split(',')
      .map((s: string) => s.trim().replace(/['"]/g, ''))
      .filter((s: string) => s && !s.includes('&&') && !s.includes('?'))
      .join(' ');
    return `class="${classes}"`;
  });
  
  // Remove remaining complex JSX expressions in attributes
  html = html.replace(/=\{[^}]+\}/g, '=""');
  
  // Remove JSX comments
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // Replace common Lucide icons with SVG placeholders
  html = replaceIconsWithSVG(html);
  
  return html;
}

// Replace Lucide icon components with actual SVGs
function replaceIconsWithSVG(html: string): string {
  const iconMap: Record<string, string> = {
    'Sparkles': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>',
    'ArrowRight': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>',
    'Check': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    'Star': '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>',
    'Zap': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
    'Shield': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
    'Globe': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"></path></svg>',
    'Menu': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>',
    'X': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    'User': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
    'Mail': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>',
    'Lock': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>',
    'Home': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>',
    'BarChart': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
    'Settings': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
    'ShoppingCart': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
    'DollarSign': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    'Users': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>',
    'TrendingUp': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>',
    'Package': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>',
  };
  
  let result = html;
  
  // Replace icon components with SVGs
  Object.entries(iconMap).forEach(([name, svg]) => {
    // Match <IconName ... /> or <IconName ...></IconName>
    const selfClosingRegex = new RegExp(`<${name}([^>]*)\\s*/>`, 'g');
    const openCloseRegex = new RegExp(`<${name}([^>]*)></${name}>`, 'g');
    
    result = result.replace(selfClosingRegex, (match, attrs) => {
      // Extract class from attributes
      const classMatch = attrs.match(/class="([^"]*)"/);
      if (classMatch) {
        return svg.replace('class="w-4 h-4"', `class="${classMatch[1]}"`);
      }
      return svg;
    });
    
    result = result.replace(openCloseRegex, (match, attrs) => {
      const classMatch = attrs.match(/class="([^"]*)"/);
      if (classMatch) {
        return svg.replace('class="w-4 h-4"', `class="${classMatch[1]}"`);
      }
      return svg;
    });
  });
  
  return result;
}

// Extract JSX return statement from a React component
function extractJSXFromComponent(content: string): string | null {
  // Try to find the return statement
  const returnMatch = content.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*(?:}|$)/);
  
  if (returnMatch) {
    let jsx = returnMatch[1].trim();
    
    // Remove fragment wrappers
    jsx = jsx.replace(/^<>/, '').replace(/<\/>$/, '');
    jsx = jsx.replace(/^<React\.Fragment>/, '').replace(/<\/React\.Fragment>$/, '');
    
    return jsx;
  }
  
  // Try arrow function with implicit return
  const arrowMatch = content.match(/=>\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/);
  if (arrowMatch) {
    return arrowMatch[1].trim();
  }
  
  return null;
}

// Parse Route elements to extract page content
function extractRoutesContent(appContent: string, files: PreviewFile[]): string | null {
  // Find Route elements with element props
  const routeMatch = appContent.match(/<Route[^>]*path=["']\/["'][^>]*element=\{([^}]+)\}/);
  
  if (routeMatch) {
    const elementContent = routeMatch[1].trim();
    
    // If it's inline JSX
    if (elementContent.startsWith('<')) {
      return elementContent;
    }
    
    // If it references a component, try to find it
    const componentName = elementContent.replace(/<([A-Z]\w+)\s*\/>/, '$1');
    const componentFile = files.find(f => 
      f.path.toLowerCase().includes(componentName.toLowerCase()) ||
      f.content.includes(`function ${componentName}`) ||
      f.content.includes(`const ${componentName}`)
    );
    
    if (componentFile) {
      return extractJSXFromComponent(componentFile.content);
    }
  }
  
  return null;
}

// Main function to generate preview HTML from actual files
export function generatePreviewHTML(files: PreviewFile[], _projectType: string = 'landing'): string {
  // Find key files
  const indexCss = files.find(f => f.path.includes('index.css'));
  const appFile = files.find(f => f.path.includes('App.tsx') || f.path.includes('App.jsx'));
  
  let styles = '';
  let bodyContent = '';
  
  // Extract styles from index.css
  if (indexCss?.content) {
    const cssVars = extractCSSVariables(indexCss.content);
    const customStyles = extractCustomStyles(indexCss.content);
    styles = `${cssVars}\n${customStyles}`;
  }
  
  // Try to extract content from App.tsx first
  if (appFile?.content) {
    // Check if App.tsx has inline content in Route element
    const routeContent = extractRoutesContent(appFile.content, files);
    if (routeContent) {
      bodyContent = jsxToHtml(routeContent);
    } else {
      // Extract JSX directly from App component
      const appJsx = extractJSXFromComponent(appFile.content);
      if (appJsx) {
        bodyContent = jsxToHtml(appJsx);
      }
    }
  }
  
  // If App.tsx didn't have usable content, look for page files
  if (!bodyContent || bodyContent.length < 50) {
    // Try to find page components
    const pageFiles = files.filter(f => 
      f.path.includes('/pages/') || 
      f.path.toLowerCase().includes('landing') ||
      f.path.toLowerCase().includes('home') ||
      f.path.toLowerCase().includes('dashboard') ||
      f.path.toLowerCase().includes('login')
    );
    
    for (const pageFile of pageFiles) {
      if (pageFile.content) {
        const pageJsx = extractJSXFromComponent(pageFile.content);
        if (pageJsx && pageJsx.length > 50) {
          bodyContent = jsxToHtml(pageJsx);
          break;
        }
      }
    }
  }
  
  // Clean up the body content
  bodyContent = cleanupHtml(bodyContent);
  
  // If still no content, show empty state
  if (!bodyContent || bodyContent.length < 30) {
    bodyContent = generateEmptyPreview();
  }
  
  return getBaseTemplate(bodyContent, styles);
}

// Clean up converted HTML
function cleanupHtml(html: string): string {
  let cleaned = html;
  
  // Remove empty attributes
  cleaned = cleaned.replace(/\s+\w+=""/g, '');
  
  // Remove React-specific attributes
  cleaned = cleaned.replace(/\s+dangerouslySetInnerHTML=\{[^}]+\}/g, '');
  cleaned = cleaned.replace(/\s+style=\{[^}]+\}/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n\s*\n/g, '\n');
  
  // Remove JSX interpolation that couldn't be processed
  cleaned = cleaned.replace(/\{[^}]*\}/g, '');
  
  // Fix any broken tags
  cleaned = cleaned.replace(/<(\w+)([^>]*)>\s*<\/\1>/g, '<$1$2></$1>');
  
  return cleaned.trim();
}

// Empty state when no content
function generateEmptyPreview(): string {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div class="text-center p-8 max-w-md">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-3">Ready to Build</h2>
        <p class="text-gray-600 mb-6">Tell the AI what you want to create and it will generate your website code. The preview will update automatically.</p>
        <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI Builder Ready
        </div>
      </div>
    </div>
  `;
}

// Create blob URL for iframe preview
export function createPreviewBlobURL(html: string): string {
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

// Cleanup blob URL
export function revokePreviewBlobURL(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
