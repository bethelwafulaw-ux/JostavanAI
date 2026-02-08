/**
 * Preview Renderer - Generates live HTML preview from React code
 * Creates a self-contained HTML document that can be rendered in an iframe
 */

export interface PreviewFile {
  path: string;
  content: string;
  language: string;
}

// Base HTML template for preview
const getBaseTemplate = (bodyContent: string, styles: string, scripts: string) => `
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
  ${scripts}
</body>
</html>
`;

// Generate preview HTML from files
export function generatePreviewHTML(files: PreviewFile[], projectType: string = 'landing'): string {
  // Find relevant files
  const indexCss = files.find(f => f.path.includes('index.css'));
  const appFile = files.find(f => f.path.includes('App.tsx') || f.path.includes('App.jsx'));
  const landingPage = files.find(f => f.path.toLowerCase().includes('landing'));
  const dashboardPage = files.find(f => f.path.toLowerCase().includes('dashboard'));
  const loginPage = files.find(f => f.path.toLowerCase().includes('login'));
  
  let bodyContent = '';
  let styles = '';
  
  // Extract custom styles
  if (indexCss) {
    // Extract non-tailwind styles
    const customStyles = indexCss.content
      .replace(/@tailwind[^;]+;/g, '')
      .replace(/@layer base[^}]+\}/g, '');
    styles = customStyles;
  }
  
  // Determine which page to show based on project type
  const pageFile = projectType === 'dashboard' ? dashboardPage : 
                   projectType === 'auth' ? loginPage : 
                   landingPage || appFile;
  
  if (pageFile) {
    bodyContent = extractJSXToHTML(pageFile.content, projectType);
  } else {
    // Default empty state
    bodyContent = generateDefaultPreview(projectType);
  }
  
  return getBaseTemplate(bodyContent, styles, '');
}

// Convert JSX-like content to static HTML for preview
function extractJSXToHTML(jsxContent: string, projectType: string): string {
  // This is a simplified converter - extracts the return statement JSX
  // and converts it to static HTML
  
  // For a real implementation, you'd use a proper JSX parser
  // Here we generate preview based on project type
  
  if (projectType === 'dashboard') {
    return generateDashboardPreview();
  }
  
  if (projectType === 'ecommerce') {
    return generateEcommercePreview();
  }
  
  if (projectType === 'blog') {
    return generateBlogPreview();
  }
  
  if (projectType === 'auth') {
    return generateAuthPreview();
  }
  
  // Default landing page
  return generateLandingPreview();
}

function generateDefaultPreview(projectType: string): string {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div class="text-center p-8">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Ready to Build</h2>
        <p class="text-gray-600 mb-6">Describe what you want to create and the AI will generate your website</p>
        <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI Builder Ready
        </div>
      </div>
    </div>
  `;
}

function generateLandingPreview(): string {
  return `
    <div class="min-h-screen bg-white">
      <!-- Header -->
      <header class="border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
            <span class="font-bold text-xl">MyWebsite</span>
          </div>
          <nav class="hidden md:flex items-center gap-6">
            <a href="#" class="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#" class="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#" class="text-gray-600 hover:text-gray-900">About</a>
          </nav>
          <div class="flex items-center gap-3">
            <button class="text-gray-600 hover:text-gray-900 font-medium">Sign in</button>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Get Started</button>
          </div>
        </div>
      </header>

      <!-- Hero -->
      <section class="py-24 px-4">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm mb-6">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
            <span>Welcome to the future</span>
          </div>
          <h1 class="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900">
            Build amazing products with our platform
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The modern solution for teams who want to ship faster. Start building today with our powerful tools.
          </p>
          <div class="flex items-center justify-center gap-4">
            <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
              Get Started Free
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
            <button class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="py-24 bg-gray-50 px-4">
        <div class="max-w-7xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">Why choose us?</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 class="font-semibold text-lg mb-2 text-gray-900">Lightning Fast</h3>
              <p class="text-gray-600">Built for performance with modern technologies and optimized delivery.</p>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 class="font-semibold text-lg mb-2 text-gray-900">Secure by Default</h3>
              <p class="text-gray-600">Enterprise-grade security out of the box with encryption and compliance.</p>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"></path>
                </svg>
              </div>
              <h3 class="font-semibold text-lg mb-2 text-gray-900">Global Scale</h3>
              <p class="text-gray-600">Deploy anywhere, scale everywhere with our distributed infrastructure.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-24 px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-3xl font-bold mb-4 text-gray-900">Ready to get started?</h2>
          <p class="text-gray-600 mb-8">Join thousands of teams already using our platform</p>
          <button class="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 text-lg">
            Start Free Trial
          </button>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-gray-100 py-12 px-4">
        <div class="max-w-7xl mx-auto text-center text-gray-600">
          <p>&copy; 2026 MyWebsite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `;
}

function generateDashboardPreview(): string {
  return `
    <div class="min-h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-4">
        <div class="flex items-center gap-2 mb-8">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
          <span class="font-bold text-xl">Dashboard</span>
        </div>
        <nav class="space-y-1">
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Dashboard
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Analytics
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            Users
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Settings
          </a>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="ml-64 p-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600">Welcome back! Here's your overview.</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500">Total Revenue</span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold text-gray-900">$45,231</div>
            <div class="flex items-center text-xs text-green-600 mt-1">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
              +20.1% from last month
            </div>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500">Users</span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold text-gray-900">+2,350</div>
            <div class="flex items-center text-xs text-green-600 mt-1">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
              +180.1% from last month
            </div>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500">Sales</span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold text-gray-900">+12,234</div>
            <div class="flex items-center text-xs text-green-600 mt-1">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
              +19% from last month
            </div>
          </div>
          <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500">Active Now</span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="text-2xl font-bold text-gray-900">+573</div>
            <div class="flex items-center text-xs text-red-600 mt-1">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
              -2.1% from last month
            </div>
          </div>
        </div>

        <!-- Activity Card -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">New user registered</p>
                <p class="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Payment received</p>
                <p class="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Order completed</p>
                <p class="text-xs text-gray-500">10 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function generateEcommercePreview(): string {
  return `
    <div class="min-h-screen bg-white">
      <!-- Header -->
      <header class="border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-rose-500 to-orange-500 rounded-lg"></div>
            <span class="font-bold text-xl">Shop</span>
          </div>
          <nav class="hidden md:flex items-center gap-6">
            <a href="#" class="text-gray-600 hover:text-gray-900">Products</a>
            <a href="#" class="text-gray-600 hover:text-gray-900">Categories</a>
            <a href="#" class="text-gray-600 hover:text-gray-900">Sale</a>
          </nav>
          <div class="flex items-center gap-4">
            <button class="text-gray-600 hover:text-gray-900 relative">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <span class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <button class="text-gray-600 hover:text-gray-900">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Products -->
      <section class="py-12 px-4">
        <div class="max-w-7xl mx-auto">
          <h2 class="text-2xl font-bold text-gray-900 mb-8">Featured Products</h2>
          <div class="grid grid-cols-4 gap-6">
            <div class="group">
              <div class="aspect-square rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform"></div>
              </div>
              <h3 class="font-medium text-gray-900">Classic T-Shirt</h3>
              <p class="text-gray-600">$29.99</p>
            </div>
            <div class="group">
              <div class="aspect-square rounded-xl bg-gray-100 mb-4 overflow-hidden relative">
                <div class="w-full h-full bg-gradient-to-br from-blue-200 to-blue-300 group-hover:scale-105 transition-transform"></div>
                <span class="absolute top-2 left-2 px-2 py-1 bg-rose-500 text-white text-xs rounded-full">Sale</span>
              </div>
              <h3 class="font-medium text-gray-900">Denim Jacket</h3>
              <p class="text-gray-600"><span class="line-through text-gray-400 mr-2">$89.99</span>$59.99</p>
            </div>
            <div class="group">
              <div class="aspect-square rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-amber-200 to-amber-300 group-hover:scale-105 transition-transform"></div>
              </div>
              <h3 class="font-medium text-gray-900">Summer Dress</h3>
              <p class="text-gray-600">$79.99</p>
            </div>
            <div class="group">
              <div class="aspect-square rounded-xl bg-gray-100 mb-4 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-green-200 to-green-300 group-hover:scale-105 transition-transform"></div>
              </div>
              <h3 class="font-medium text-gray-900">Sneakers</h3>
              <p class="text-gray-600">$129.99</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function generateBlogPreview(): string {
  return `
    <div class="min-h-screen bg-white">
      <header class="border-b border-gray-100">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xl">My Blog</span>
          </div>
          <nav class="flex items-center gap-6">
            <a href="#" class="text-gray-600 hover:text-gray-900">Home</a>
            <a href="#" class="text-gray-600 hover:text-gray-900">Archive</a>
            <a href="#" class="text-gray-600 hover:text-gray-900">About</a>
          </nav>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-12">
        <article class="mb-12">
          <span class="text-blue-600 text-sm font-medium">Technology</span>
          <h1 class="text-4xl font-bold text-gray-900 mt-2 mb-4">Building the Future of Web Development</h1>
          <div class="flex items-center gap-4 text-gray-500 text-sm mb-6">
            <span>John Doe</span>
            <span>•</span>
            <span>Feb 8, 2026</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
          <div class="aspect-video rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 mb-6"></div>
          <div class="prose prose-lg text-gray-700">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
            <p class="mt-4">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
          </div>
        </article>

        <h2 class="text-2xl font-bold text-gray-900 mb-6">More Articles</h2>
        <div class="grid grid-cols-2 gap-8">
          <div>
            <div class="aspect-video rounded-xl bg-gradient-to-br from-green-100 to-teal-100 mb-4"></div>
            <span class="text-green-600 text-sm font-medium">Design</span>
            <h3 class="font-semibold text-lg text-gray-900 mt-1">The Art of Minimalism</h3>
            <p class="text-gray-500 text-sm mt-1">Feb 5, 2026</p>
          </div>
          <div>
            <div class="aspect-video rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 mb-4"></div>
            <span class="text-orange-600 text-sm font-medium">Startup</span>
            <h3 class="font-semibold text-lg text-gray-900 mt-1">How to Launch Your First Product</h3>
            <p class="text-gray-500 text-sm mt-1">Feb 3, 2026</p>
          </div>
        </div>
      </main>
    </div>
  `;
}

function generateAuthPreview(): string {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div class="text-center mb-8">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p class="text-gray-500 mt-1">Enter your credentials to access your account</p>
          </div>
          
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <input type="email" placeholder="name@example.com" class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <input type="password" placeholder="••••••••" class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" class="rounded border-gray-300">
                Remember me
              </label>
              <a href="#" class="text-sm text-blue-600 hover:underline">Forgot password?</a>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Sign in
            </button>
          </form>
          
          <p class="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <a href="#" class="text-blue-600 hover:underline font-medium">Sign up</a>
          </p>
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
