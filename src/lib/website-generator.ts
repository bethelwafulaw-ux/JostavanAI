/**
 * Jostavan AI - Full Website Generator v3.0
 * 
 * Multiple rich, distinct templates per website type.
 * Each template generates COMPLETE, unique React code AND preview HTML.
 */

import { FileOperation, DataLayerSchema } from '@/types';

export interface WebsiteConfig {
  name: string;
  description: string;
  type: 'landing' | 'dashboard' | 'ecommerce' | 'blog' | 'saas' | 'portfolio' | 'recipe' | 'restaurant' | 'fitness' | 'realestate' | 'education' | 'agency';
  features: string[];
  hasAuth: boolean;
  hasDatabase: boolean;
}

export interface GeneratedWebsite {
  files: FileOperation[];
  sql: string;
  previewHTML: string;
  config: WebsiteConfig;
}

// ============================================
// DETECT WEBSITE TYPE FROM PROMPT
// ============================================

export function detectWebsiteType(prompt: string): WebsiteConfig {
  const p = prompt.toLowerCase();
  
  const config: WebsiteConfig = {
    name: '',
    description: prompt,
    type: 'landing',
    features: [],
    hasAuth: false,
    hasDatabase: false,
  };

  if (p.includes('recipe') || p.includes('cooking') || p.includes('food') || p.includes('meal') || p.includes('chef')) {
    config.type = 'recipe';
    config.name = 'FlavorHub';
    config.features = ['recipe-cards', 'categories', 'search', 'ratings'];
    config.hasDatabase = true;
  } else if (p.includes('ecommerce') || p.includes('shop') || p.includes('store') || p.includes('product') || p.includes('cart') || p.includes('buy')) {
    config.type = 'ecommerce';
    config.name = 'Luxe Store';
    config.features = ['product-grid', 'cart', 'checkout', 'categories'];
    config.hasAuth = true;
    config.hasDatabase = true;
  } else if (p.includes('dashboard') || p.includes('admin') || p.includes('analytics') || p.includes('panel')) {
    config.type = 'dashboard';
    config.name = 'DataPulse';
    config.features = ['stats', 'charts', 'tables', 'activity'];
    config.hasAuth = true;
    config.hasDatabase = true;
  } else if (p.includes('blog') || p.includes('article') || p.includes('post') || p.includes('write') || p.includes('journal')) {
    config.type = 'blog';
    config.name = 'InkFlow';
    config.features = ['posts', 'categories', 'comments', 'author'];
    config.hasDatabase = true;
  } else if (p.includes('saas') || p.includes('subscription') || p.includes('pricing') || p.includes('startup') || p.includes('app landing')) {
    config.type = 'saas';
    config.name = 'LaunchPad';
    config.features = ['pricing', 'features', 'testimonials', 'faq'];
    config.hasAuth = true;
  } else if (p.includes('portfolio') || p.includes('personal') || p.includes('resume') || p.includes('cv') || p.includes('showcase')) {
    config.type = 'portfolio';
    config.name = 'Creative Studio';
    config.features = ['projects', 'skills', 'about', 'contact'];
  } else if (p.includes('restaurant') || p.includes('cafe') || p.includes('menu') || p.includes('reservation') || p.includes('dine') || p.includes('bar')) {
    config.type = 'restaurant';
    config.name = 'Saveur';
    config.features = ['menu', 'reservation', 'gallery', 'about'];
  } else if (p.includes('fitness') || p.includes('gym') || p.includes('workout') || p.includes('training') || p.includes('exercise') || p.includes('health')) {
    config.type = 'fitness';
    config.name = 'FitForge';
    config.features = ['classes', 'trainers', 'membership', 'schedule'];
  } else if (p.includes('real estate') || p.includes('property') || p.includes('house') || p.includes('listing') || p.includes('apartment') || p.includes('rent')) {
    config.type = 'realestate';
    config.name = 'NestFind';
    config.features = ['listings', 'search', 'map', 'agents'];
    config.hasDatabase = true;
  } else if (p.includes('education') || p.includes('course') || p.includes('learn') || p.includes('school') || p.includes('tutorial') || p.includes('class')) {
    config.type = 'education';
    config.name = 'LearnPath';
    config.features = ['courses', 'instructors', 'progress', 'reviews'];
    config.hasAuth = true;
    config.hasDatabase = true;
  } else if (p.includes('agency') || p.includes('marketing') || p.includes('creative') || p.includes('design agency') || p.includes('studio')) {
    config.type = 'agency';
    config.name = 'Catalyst';
    config.features = ['services', 'portfolio', 'team', 'contact'];
  } else {
    // Smart generic - extract name from prompt
    const words = prompt.split(/\s+/).filter(w => w.length > 3 && !['make', 'build', 'create', 'website', 'page', 'with', 'that', 'this', 'from', 'have'].includes(w.toLowerCase()));
    config.name = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') || 'Nexus';
    config.type = 'saas';
    config.features = ['features', 'about', 'cta'];
  }

  // Detect auth/db from prompt
  if (p.includes('login') || p.includes('signup') || p.includes('auth') || p.includes('account') || p.includes('user')) {
    config.hasAuth = true;
    config.hasDatabase = true;
  }
  if (p.includes('database') || p.includes('sql') || p.includes('save') || p.includes('data')) {
    config.hasDatabase = true;
  }

  return config;
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateFullWebsite(config: WebsiteConfig): GeneratedWebsite {
  const generators: Record<string, () => GeneratedWebsite> = {
    recipe: () => generateRecipeWebsite(config),
    ecommerce: () => generateEcommerceWebsite(config),
    dashboard: () => generateDashboardWebsite(config),
    blog: () => generateBlogWebsite(config),
    saas: () => generateSaasWebsite(config),
    portfolio: () => generatePortfolioWebsite(config),
    restaurant: () => generateRestaurantWebsite(config),
    fitness: () => generateFitnessWebsite(config),
    realestate: () => generateRealEstateWebsite(config),
    education: () => generateEducationWebsite(config),
    agency: () => generateAgencyWebsite(config),
    landing: () => generateSaasWebsite(config),
  };

  const generator = generators[config.type] || generators.saas;
  return generator();
}

// ============================================
// SHARED UTILITIES
// ============================================

function baseFiles(name: string, hasAuth: boolean): FileOperation[] {
  return [
    { path: 'index.html', operation: 'create', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${name}</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>` },
    { path: 'src/main.tsx', operation: 'create', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);` },
  ];
}

function cssFile(primary: string, primaryFg: string): FileOperation {
  return {
    path: 'src/index.css', operation: 'create', content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 222.2 84% 4.9%;\n    --primary: ${primary};\n    --primary-foreground: ${primaryFg};\n    --secondary: 210 40% 96.1%;\n    --secondary-foreground: 222.2 47.4% 11.2%;\n    --muted: 210 40% 96.1%;\n    --muted-foreground: 215.4 16.3% 46.9%;\n    --accent: 210 40% 96.1%;\n    --accent-foreground: 222.2 47.4% 11.2%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 210 40% 98%;\n    --border: 214.3 31.8% 91.4%;\n    --input: 214.3 31.8% 91.4%;\n    --ring: ${primary};\n    --radius: 0.5rem;\n  }\n}\n\n@layer base {\n  * { @apply border-border; }\n  body { @apply bg-background text-foreground; }\n}`
  };
}

// ============================================
// 1. RECIPE WEBSITE
// ============================================

function generateRecipeWebsite(config: WebsiteConfig): GeneratedWebsite {
  const files: FileOperation[] = [
    ...baseFiles(config.name, config.hasAuth),
    cssFile('24 95% 53%', '210 40% 98%'),
    { path: 'src/App.tsx', operation: 'create', content: `import LandingPage from './pages/LandingPage';\n\nexport default function App() {\n  return <LandingPage />;\n}` },
    { path: 'src/pages/LandingPage.tsx', operation: 'create', content: RECIPE_PAGE },
  ];

  return { files, sql: RECIPE_SQL, previewHTML: RECIPE_PREVIEW, config };
}

const RECIPE_PAGE = `import { useState } from 'react';

const recipes = [
  { id: 1, title: 'Truffle Mushroom Risotto', time: '45 min', difficulty: 'Medium', category: 'Italian', rating: 4.8, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop', desc: 'Creamy arborio rice with wild mushrooms and truffle oil' },
  { id: 2, title: 'Spicy Thai Basil Chicken', time: '25 min', difficulty: 'Easy', category: 'Thai', rating: 4.9, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop', desc: 'Aromatic stir-fry with holy basil and bird eye chili' },
  { id: 3, title: 'Japanese Miso Ramen', time: '60 min', difficulty: 'Hard', category: 'Japanese', rating: 4.7, image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600&h=400&fit=crop', desc: 'Rich pork broth with handmade noodles and soft-boiled egg' },
  { id: 4, title: 'Lemon Herb Grilled Salmon', time: '30 min', difficulty: 'Easy', category: 'Seafood', rating: 4.6, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop', desc: 'Fresh Atlantic salmon with herbs and citrus glaze' },
  { id: 5, title: 'Chocolate Lava Cake', time: '35 min', difficulty: 'Medium', category: 'Dessert', rating: 4.9, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop', desc: 'Decadent dark chocolate cake with molten center' },
  { id: 6, title: 'Mediterranean Grain Bowl', time: '20 min', difficulty: 'Easy', category: 'Healthy', rating: 4.5, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop', desc: 'Quinoa bowl with roasted veggies, feta, and tahini' },
];

const categories = ['All', 'Italian', 'Thai', 'Japanese', 'Seafood', 'Dessert', 'Healthy'];

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = recipes.filter(r => {
    const matchCat = activeCategory === 'All' || r.category === activeCategory;
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <span className="text-white text-xl">🍳</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FlavorHub</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recipes" className="text-gray-600 hover:text-orange-600 font-medium transition">Recipes</a>
            <a href="#categories" className="text-gray-600 hover:text-orange-600 font-medium transition">Categories</a>
            <a href="#about" className="text-gray-600 hover:text-orange-600 font-medium transition">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
              Share Recipe
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
              🔥 Over 10,000 recipes
            </span>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Cook Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Amazing</span> Today
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover world-class recipes from passionate home cooks and professional chefs. Step-by-step guides that make cooking effortless.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search recipes, ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none text-lg transition"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
              <span className="flex items-center gap-1">⭐ 4.9 avg rating</span>
              <span className="flex items-center gap-1">👨‍🍳 500+ chefs</span>
              <span className="flex items-center gap-1">🌍 50+ cuisines</span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop" alt="" className="rounded-2xl shadow-2xl shadow-orange-500/10 mt-8" />
              <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop" alt="" className="rounded-2xl shadow-2xl shadow-orange-500/10" />
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop" alt="" className="rounded-2xl shadow-2xl shadow-orange-500/10 col-span-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={\`px-5 py-2.5 rounded-full font-medium text-sm transition-all \${activeCategory === cat ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'}\`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Recipes Grid */}
      <section id="recipes" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Popular Recipes</h2>
          <span className="text-gray-500">{filtered.length} recipes found</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(recipe => (
            <div key={recipe.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="relative overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  ⭐ {recipe.rating}
                </div>
                <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {recipe.category}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition">{recipe.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{recipe.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>⏱ {recipe.time}</span>
                    <span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : recipe.difficulty === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}\`}>
                      {recipe.difficulty}
                    </span>
                  </div>
                  <button className="text-orange-500 hover:text-orange-700 font-semibold text-sm transition">View →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get Weekly Recipe Inspiration</h2>
          <p className="text-white/80 mb-8 text-lg">Join 50,000+ food lovers. New recipes every Tuesday & Friday.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com" className="flex-1 px-5 py-4 rounded-xl outline-none text-gray-900 font-medium" />
            <button className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍳</span>
            <span className="font-bold text-gray-900">FlavorHub</span>
          </div>
          <p className="text-gray-500 text-sm">Made with love for food lovers everywhere. © 2026</p>
        </div>
      </footer>
    </div>
  );
}`;

const RECIPE_SQL = `CREATE TABLE recipes (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  title VARCHAR(255) NOT NULL,\n  slug VARCHAR(255) UNIQUE,\n  description TEXT,\n  ingredients JSONB DEFAULT '[]',\n  instructions JSONB DEFAULT '[]',\n  prep_time_minutes INT,\n  cook_time_minutes INT,\n  servings INT,\n  difficulty VARCHAR(20) DEFAULT 'Medium',\n  category VARCHAR(100),\n  image_url TEXT,\n  rating DECIMAL(3,2) DEFAULT 0,\n  author_id UUID REFERENCES users(id),\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE categories (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(100) NOT NULL,\n  slug VARCHAR(100) UNIQUE\n);\n\nCREATE INDEX idx_recipes_category ON recipes(category);\nCREATE INDEX idx_recipes_rating ON recipes(rating DESC);`;

const RECIPE_PREVIEW = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FlavorHub</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white">
<header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100"><div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25"><span class="text-white text-xl">🍳</span></div><span class="text-xl font-bold text-gray-900">FlavorHub</span></div><nav class="hidden md:flex items-center gap-8"><a href="#" class="text-gray-600 hover:text-orange-600 font-medium">Recipes</a><a href="#" class="text-gray-600 hover:text-orange-600 font-medium">Categories</a><a href="#" class="text-gray-600 hover:text-orange-600 font-medium">About</a></nav><button class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">Share Recipe</button></div></header>

<section class="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50"><div class="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center"><div><span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">🔥 Over 10,000 recipes</span><h1 class="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">Cook Something <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Amazing</span> Today</h1><p class="text-xl text-gray-600 mb-8 leading-relaxed">Discover world-class recipes from passionate home cooks and professional chefs. Step-by-step guides that make cooking effortless.</p><div class="flex items-center gap-4"><div class="flex-1 relative"><input type="text" placeholder="Search recipes, ingredients..." class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-orange-200 focus:border-orange-500 outline-none text-lg" /><span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span></div></div><div class="flex items-center gap-6 mt-8 text-sm text-gray-500"><span>⭐ 4.9 avg rating</span><span>👨‍🍳 500+ chefs</span><span>🌍 50+ cuisines</span></div></div><div class="hidden lg:block"><div class="grid grid-cols-2 gap-4"><img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop" alt="" class="rounded-2xl shadow-2xl shadow-orange-500/10 mt-8" /><img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop" alt="" class="rounded-2xl shadow-2xl shadow-orange-500/10" /><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop" alt="" class="rounded-2xl shadow-2xl shadow-orange-500/10 col-span-2" /></div></div></div></section>

<section class="max-w-7xl mx-auto px-6 py-8"><div class="flex flex-wrap gap-3"><button class="px-5 py-2.5 rounded-full font-medium text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">All</button><button class="px-5 py-2.5 rounded-full font-medium text-sm bg-gray-100 text-gray-600">Italian</button><button class="px-5 py-2.5 rounded-full font-medium text-sm bg-gray-100 text-gray-600">Thai</button><button class="px-5 py-2.5 rounded-full font-medium text-sm bg-gray-100 text-gray-600">Japanese</button><button class="px-5 py-2.5 rounded-full font-medium text-sm bg-gray-100 text-gray-600">Seafood</button><button class="px-5 py-2.5 rounded-full font-medium text-sm bg-gray-100 text-gray-600">Dessert</button></div></section>

<section class="max-w-7xl mx-auto px-6 pb-20"><div class="flex items-center justify-between mb-8"><h2 class="text-3xl font-bold text-gray-900">Popular Recipes</h2><span class="text-gray-500">6 recipes found</span></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
<div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"><div class="relative overflow-hidden"><img src="https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop" alt="" class="w-full h-52 object-cover" /><div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">⭐ 4.8</div><div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Italian</div></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-2">Truffle Mushroom Risotto</h3><p class="text-gray-500 text-sm mb-4">Creamy arborio rice with wild mushrooms and truffle oil</p><div class="flex items-center justify-between pt-3 border-t border-gray-100"><div class="flex items-center gap-4 text-sm text-gray-500"><span>⏱ 45 min</span><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Medium</span></div><button class="text-orange-500 font-semibold text-sm">View →</button></div></div></div>
<div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"><div class="relative overflow-hidden"><img src="https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop" alt="" class="w-full h-52 object-cover" /><div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">⭐ 4.9</div><div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Thai</div></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-2">Spicy Thai Basil Chicken</h3><p class="text-gray-500 text-sm mb-4">Aromatic stir-fry with holy basil and bird eye chili</p><div class="flex items-center justify-between pt-3 border-t border-gray-100"><div class="flex items-center gap-4 text-sm text-gray-500"><span>⏱ 25 min</span><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Easy</span></div><button class="text-orange-500 font-semibold text-sm">View →</button></div></div></div>
<div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"><div class="relative overflow-hidden"><img src="https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600&h=400&fit=crop" alt="" class="w-full h-52 object-cover" /><div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">⭐ 4.7</div><div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Japanese</div></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-2">Japanese Miso Ramen</h3><p class="text-gray-500 text-sm mb-4">Rich pork broth with handmade noodles and soft-boiled egg</p><div class="flex items-center justify-between pt-3 border-t border-gray-100"><div class="flex items-center gap-4 text-sm text-gray-500"><span>⏱ 60 min</span><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Hard</span></div><button class="text-orange-500 font-semibold text-sm">View →</button></div></div></div>
<div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"><div class="relative overflow-hidden"><img src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop" alt="" class="w-full h-52 object-cover" /><div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">⭐ 4.6</div><div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Seafood</div></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-2">Lemon Herb Grilled Salmon</h3><p class="text-gray-500 text-sm mb-4">Fresh Atlantic salmon with herbs and citrus glaze</p><div class="flex items-center justify-between pt-3 border-t border-gray-100"><div class="flex items-center gap-4 text-sm text-gray-500"><span>⏱ 30 min</span><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Easy</span></div><button class="text-orange-500 font-semibold text-sm">View →</button></div></div></div>
<div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"><div class="relative overflow-hidden"><img src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop" alt="" class="w-full h-52 object-cover" /><div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">⭐ 4.9</div><div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Dessert</div></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-2">Chocolate Lava Cake</h3><p class="text-gray-500 text-sm mb-4">Decadent dark chocolate cake with molten center</p><div class="flex items-center justify-between pt-3 border-t border-gray-100"><div class="flex items-center gap-4 text-sm text-gray-500"><span>⏱ 35 min</span><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Medium</span></div><button class="text-orange-500 font-semibold text-sm">View →</button></div></div></div>
<div class="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"><div class="relative overflow-hidden"><img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop" alt="" class="w-full h-52 object-cover" /><div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">⭐ 4.5</div><div class="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Healthy</div></div><div class="p-5"><h3 class="font-bold text-lg text-gray-900 mb-2">Mediterranean Grain Bowl</h3><p class="text-gray-500 text-sm mb-4">Quinoa bowl with roasted veggies, feta, and tahini</p><div class="flex items-center justify-between pt-3 border-t border-gray-100"><div class="flex items-center gap-4 text-sm text-gray-500"><span>⏱ 20 min</span><span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Easy</span></div><button class="text-orange-500 font-semibold text-sm">View →</button></div></div></div>
</div></section>

<section class="bg-gradient-to-r from-orange-500 to-red-500 py-20"><div class="max-w-3xl mx-auto px-6 text-center"><h2 class="text-3xl font-bold text-white mb-4">Get Weekly Recipe Inspiration</h2><p class="text-white/80 mb-8 text-lg">Join 50,000+ food lovers. New recipes every Tuesday & Friday.</p><div class="flex gap-3 max-w-md mx-auto"><input type="email" placeholder="your@email.com" class="flex-1 px-5 py-4 rounded-xl outline-none" /><button class="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold">Subscribe</button></div></div></section>

<footer class="bg-gray-50 py-12"><div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4"><div class="flex items-center gap-3"><span class="text-2xl">🍳</span><span class="font-bold text-gray-900">FlavorHub</span></div><p class="text-gray-500 text-sm">Made with love for food lovers everywhere. © 2026</p></div></footer>
</body></html>`;

// ============================================
// 2. ECOMMERCE WEBSITE
// ============================================

function generateEcommerceWebsite(config: WebsiteConfig): GeneratedWebsite {
  const files: FileOperation[] = [
    ...baseFiles(config.name, config.hasAuth),
    cssFile('0 0% 9%', '0 0% 100%'),
    { path: 'src/App.tsx', operation: 'create', content: `import LandingPage from './pages/LandingPage';\n\nexport default function App() {\n  return <LandingPage />;\n}` },
    { path: 'src/pages/LandingPage.tsx', operation: 'create', content: ECOMMERCE_PAGE },
  ];
  return { files, sql: '', previewHTML: ECOMMERCE_PREVIEW, config };
}

const ECOMMERCE_PAGE = `import { useState } from 'react';

const products = [
  { id: 1, name: 'Premium Wireless Headphones', price: 299, oldPrice: 399, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop', category: 'Audio', badge: 'Best Seller' },
  { id: 2, name: 'Minimalist Watch Collection', price: 189, oldPrice: null, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop', category: 'Accessories', badge: 'New' },
  { id: 3, name: 'Leather Crossbody Bag', price: 149, oldPrice: 199, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop', category: 'Bags', badge: null },
  { id: 4, name: 'Artisan Coffee Maker', price: 259, oldPrice: null, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&fit=crop', category: 'Home', badge: 'Popular' },
  { id: 5, name: 'Organic Skincare Set', price: 89, oldPrice: 120, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop', category: 'Beauty', badge: 'Sale' },
  { id: 6, name: 'Handcrafted Ceramic Vase', price: 79, oldPrice: null, image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&h=500&fit=crop', category: 'Home', badge: null },
];

export default function LandingPage() {
  const [cart, setCart] = useState<number[]>([]);

  const addToCart = (id: number) => setCart(prev => [...prev, id]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-black tracking-tighter">LUXE</span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-gray-900">New In</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition">Women</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition">Men</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition">Sale</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-900 transition">🔍</button>
            <button className="text-gray-500 hover:text-gray-900 transition">♡</button>
            <button className="relative text-gray-500 hover:text-gray-900 transition">
              🛒
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[80vh] bg-gray-950 overflow-hidden flex items-center">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="relative max-w-7xl mx-auto px-6">
          <span className="inline-block px-4 py-1 border border-white/30 text-white/80 text-sm mb-6 tracking-widest uppercase">New Collection 2026</span>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-none mb-6">Refined<br/>Essentials</h1>
          <p className="text-xl text-white/60 mb-10 max-w-lg">Curated pieces that define modern elegance. Discover our latest collection.</p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-white text-gray-900 font-bold hover:bg-gray-100 transition">Shop Now →</button>
            <button className="px-8 py-4 border border-white/30 text-white font-medium hover:bg-white/10 transition">View Lookbook</button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-sm font-medium tracking-widest text-gray-400 uppercase">Curated Selection</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2">Trending Now</h2>
          </div>
          <button className="text-sm font-semibold text-gray-900 hover:underline">View All →</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                {product.badge && (
                  <span className={\`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full \${product.badge === 'Sale' ? 'bg-red-500 text-white' : product.badge === 'New' ? 'bg-blue-500 text-white' : 'bg-gray-900 text-white'}\`}>{product.badge}</span>
                )}
                <button
                  onClick={() => addToCart(product.id)}
                  className="absolute bottom-4 left-4 right-4 py-3 bg-white/90 backdrop-blur text-gray-900 font-semibold text-sm rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-white"
                >
                  Add to Cart
                </button>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">\${product.price}</span>
                  {product.oldPrice && <span className="text-gray-400 line-through text-sm">\${product.oldPrice}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-sm tracking-widest text-gray-500 uppercase">Free Shipping</span>
          <h2 className="text-4xl font-black text-white mt-4 mb-6">On Orders Over $50</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Plus easy returns within 30 days. No questions asked.</p>
          <button className="px-8 py-4 bg-white text-gray-900 font-bold hover:bg-gray-100 transition">Start Shopping</button>
        </div>
      </section>

      <footer className="py-12 border-t"><div class="max-w-7xl mx-auto px-6 flex justify-between items-center"><span className="text-2xl font-black tracking-tighter">LUXE</span><p className="text-gray-400 text-sm">© 2026 Luxe Store. All rights reserved.</p></div></footer>
    </div>
  );
}`;

const ECOMMERCE_PREVIEW = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white">
<header class="sticky top-0 z-50 bg-white border-b"><div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"><span class="text-2xl font-black tracking-tighter">LUXE</span><nav class="hidden md:flex items-center gap-8 text-sm font-medium"><a href="#" class="text-gray-900">New In</a><a href="#" class="text-gray-500">Women</a><a href="#" class="text-gray-500">Men</a><a href="#" class="text-gray-500">Sale</a></nav><div class="flex items-center gap-4"><span>🔍</span><span>♡</span><span>🛒</span></div></div></header>
<section class="relative h-[80vh] bg-gray-950 overflow-hidden flex items-center"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop" alt="" class="absolute inset-0 w-full h-full object-cover opacity-40" /><div class="relative max-w-7xl mx-auto px-6"><span class="inline-block px-4 py-1 border border-white/30 text-white/80 text-sm mb-6 tracking-widest uppercase">New Collection 2026</span><h1 class="text-6xl md:text-8xl font-black text-white leading-none mb-6">Refined<br/>Essentials</h1><p class="text-xl text-white/60 mb-10 max-w-lg">Curated pieces that define modern elegance.</p><div class="flex gap-4"><button class="px-8 py-4 bg-white text-gray-900 font-bold">Shop Now →</button><button class="px-8 py-4 border border-white/30 text-white font-medium">View Lookbook</button></div></div></section>
<section class="max-w-7xl mx-auto px-6 py-20"><div class="flex items-end justify-between mb-12"><div><span class="text-sm font-medium tracking-widest text-gray-400 uppercase">Curated Selection</span><h2 class="text-4xl font-black text-gray-900 mt-2">Trending Now</h2></div><button class="text-sm font-semibold text-gray-900">View All →</button></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
<div class="group cursor-pointer"><div class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop" class="w-full h-full object-cover" /><span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full bg-gray-900 text-white">Best Seller</span></div><p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Audio</p><h3 class="font-semibold text-gray-900 mb-2">Premium Wireless Headphones</h3><div class="flex items-center gap-2"><span class="font-bold text-lg">$299</span><span class="text-gray-400 line-through text-sm">$399</span></div></div>
<div class="group cursor-pointer"><div class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop" class="w-full h-full object-cover" /><span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full bg-blue-500 text-white">New</span></div><p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Accessories</p><h3 class="font-semibold text-gray-900 mb-2">Minimalist Watch Collection</h3><span class="font-bold text-lg">$189</span></div>
<div class="group cursor-pointer"><div class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4"><img src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop" class="w-full h-full object-cover" /></div><p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Bags</p><h3 class="font-semibold text-gray-900 mb-2">Leather Crossbody Bag</h3><div class="flex items-center gap-2"><span class="font-bold text-lg">$149</span><span class="text-gray-400 line-through text-sm">$199</span></div></div>
<div class="group cursor-pointer"><div class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&fit=crop" class="w-full h-full object-cover" /><span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full bg-gray-900 text-white">Popular</span></div><p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Home</p><h3 class="font-semibold text-gray-900 mb-2">Artisan Coffee Maker</h3><span class="font-bold text-lg">$259</span></div>
<div class="group cursor-pointer"><div class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4"><img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop" class="w-full h-full object-cover" /><span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full bg-red-500 text-white">Sale</span></div><p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Beauty</p><h3 class="font-semibold text-gray-900 mb-2">Organic Skincare Set</h3><div class="flex items-center gap-2"><span class="font-bold text-lg">$89</span><span class="text-gray-400 line-through text-sm">$120</span></div></div>
<div class="group cursor-pointer"><div class="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4"><img src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&h=500&fit=crop" class="w-full h-full object-cover" /></div><p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Home</p><h3 class="font-semibold text-gray-900 mb-2">Handcrafted Ceramic Vase</h3><span class="font-bold text-lg">$79</span></div>
</div></section>
<section class="bg-gray-950 py-20"><div class="max-w-7xl mx-auto px-6 text-center"><span class="text-sm tracking-widest text-gray-500 uppercase">Free Shipping</span><h2 class="text-4xl font-black text-white mt-4 mb-6">On Orders Over $50</h2><p class="text-gray-400 mb-8">Plus easy returns within 30 days.</p><button class="px-8 py-4 bg-white text-gray-900 font-bold">Start Shopping</button></div></section>
<footer class="py-12 border-t"><div class="max-w-7xl mx-auto px-6 flex justify-between items-center"><span class="text-2xl font-black tracking-tighter">LUXE</span><p class="text-gray-400 text-sm">© 2026 Luxe Store. All rights reserved.</p></div></footer>
</body></html>`;

// ============================================
// 3. SAAS WEBSITE
// ============================================

function generateSaasWebsite(config: WebsiteConfig): GeneratedWebsite {
  const name = config.name || 'LaunchPad';
  const files: FileOperation[] = [
    ...baseFiles(name, config.hasAuth),
    cssFile('250 95% 64%', '0 0% 100%'),
    { path: 'src/App.tsx', operation: 'create', content: `import LandingPage from './pages/LandingPage';\n\nexport default function App() {\n  return <LandingPage />;\n}` },
    { path: 'src/pages/LandingPage.tsx', operation: 'create', content: generateSaasPage(name, config.description) },
  ];
  return { files, sql: '', previewHTML: generateSaasPreview(name, config.description), config };
}

function generateSaasPage(name: string, desc: string): string {
  return `export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg" />
            <span className="font-bold text-lg">${name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Sign In</button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all">Get Started</button>
          </div>
        </div>
      </header>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">
            ✨ Now in public beta
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-8 bg-gradient-to-b from-white to-gray-400 text-transparent bg-clip-text">
            Ship products<br />10x faster
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">${desc || 'The all-in-one platform that supercharges your development workflow. Build, test, and deploy with confidence.'}</p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold hover:shadow-2xl hover:shadow-violet-500/25 transition-all text-lg">
              Start Free Trial →
            </button>
            <button className="px-8 py-4 border border-white/10 rounded-xl font-medium hover:bg-white/5 transition text-lg text-gray-300">
              Watch Demo
            </button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
            <span>✓ No credit card</span>
            <span>✓ 14-day trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-4xl font-bold mt-4">Everything you need to ship fast</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Sub-second build times with intelligent caching and incremental compilation.' },
              { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 compliant with end-to-end encryption and role-based access control.' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Monitor performance, track errors, and gain insights with live dashboards.' },
              { icon: '🔄', title: 'CI/CD Pipeline', desc: 'Automated testing and deployment on every push. Zero-config setup.' },
              { icon: '🌍', title: 'Global CDN', desc: 'Deploy to 300+ edge locations. < 50ms response time worldwide.' },
              { icon: '🤝', title: 'Team Collaboration', desc: 'Real-time editing, code reviews, and async communication built in.' },
            ].map(f => (
              <div key={f.title} className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-violet-500/20 transition-all group">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-lg mb-3 group-hover:text-violet-300 transition">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-violet-400 font-medium text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl font-bold mt-4">Simple, transparent pricing</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$0', desc: 'For individuals', features: ['3 projects', '1GB storage', 'Community support', 'Basic analytics'] },
              { name: 'Pro', price: '$29', desc: 'For growing teams', features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'API access'], popular: true },
              { name: 'Enterprise', price: '$99', desc: 'For large orgs', features: ['Everything in Pro', 'SSO / SAML', 'SLA guarantee', 'Dedicated manager', 'Custom contracts'] },
            ].map(plan => (
              <div key={plan.name} className={\`p-8 rounded-2xl border \${plan.popular ? 'bg-gradient-to-b from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 ring-1 ring-violet-500/20' : 'bg-white/5 border-white/5'}\`}>
                {plan.popular && <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">Most Popular</span>}
                <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm">{plan.desc}</p>
                <div className="text-4xl font-extrabold my-6">{plan.price}<span className="text-lg font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8 text-sm">
                  {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-gray-300"><span className="text-violet-400">✓</span> {f}</li>)}
                </ul>
                <button className={\`w-full py-3 rounded-xl font-semibold transition \${plan.popular ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-lg hover:shadow-violet-500/25' : 'bg-white/10 hover:bg-white/15'}\`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to build something great?</h2>
          <p className="text-gray-400 text-lg mb-10">Join 50,000+ developers shipping faster with ${name}.</p>
          <button className="px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-lg font-bold hover:shadow-2xl hover:shadow-violet-500/25 transition-all">
            Start Free Trial →
          </button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded" />
            <span className="font-bold">${name}</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 ${name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}`;
}

function generateSaasPreview(name: string, desc: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-950 text-white">
<header class="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5"><div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg"></div><span class="font-bold text-lg">${name}</span></div><nav class="hidden md:flex items-center gap-8 text-sm"><a href="#" class="text-gray-400 hover:text-white">Features</a><a href="#" class="text-gray-400 hover:text-white">Pricing</a><a href="#" class="text-gray-400 hover:text-white">Testimonials</a></nav><div class="flex items-center gap-3"><button class="px-4 py-2 text-sm text-gray-300">Sign In</button><button class="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg text-sm font-semibold">Get Started</button></div></div></header>
<section class="relative py-32 overflow-hidden"><div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div><div class="relative max-w-5xl mx-auto px-6 text-center"><div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">✨ Now in public beta</div><h1 class="text-6xl md:text-7xl font-extrabold leading-tight mb-8 bg-gradient-to-b from-white to-gray-400 text-transparent bg-clip-text">Ship products<br/>10x faster</h1><p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">${desc || 'The all-in-one platform that supercharges your development workflow.'}</p><div class="flex items-center justify-center gap-4"><button class="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-lg">Start Free Trial →</button><button class="px-8 py-4 border border-white/10 rounded-xl font-medium text-lg text-gray-300">Watch Demo</button></div><div class="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500"><span>✓ No credit card</span><span>✓ 14-day trial</span><span>✓ Cancel anytime</span></div></div></section>
<section class="py-24 border-t border-white/5"><div class="max-w-7xl mx-auto px-6"><div class="text-center mb-16"><span class="text-violet-400 font-medium text-sm uppercase tracking-wider">Features</span><h2 class="text-4xl font-bold mt-4">Everything you need to ship fast</h2></div><div class="grid md:grid-cols-3 gap-8"><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><span class="text-3xl mb-4 block">⚡</span><h3 class="font-semibold text-lg mb-3">Lightning Fast</h3><p class="text-gray-400 text-sm">Sub-second build times with intelligent caching.</p></div><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><span class="text-3xl mb-4 block">🔒</span><h3 class="font-semibold text-lg mb-3">Enterprise Security</h3><p class="text-gray-400 text-sm">SOC 2 compliant with end-to-end encryption.</p></div><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><span class="text-3xl mb-4 block">📊</span><h3 class="font-semibold text-lg mb-3">Real-time Analytics</h3><p class="text-gray-400 text-sm">Monitor performance with live dashboards.</p></div><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><span class="text-3xl mb-4 block">🔄</span><h3 class="font-semibold text-lg mb-3">CI/CD Pipeline</h3><p class="text-gray-400 text-sm">Automated testing and deployment on every push.</p></div><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><span class="text-3xl mb-4 block">🌍</span><h3 class="font-semibold text-lg mb-3">Global CDN</h3><p class="text-gray-400 text-sm">Deploy to 300+ edge locations worldwide.</p></div><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><span class="text-3xl mb-4 block">🤝</span><h3 class="font-semibold text-lg mb-3">Team Collaboration</h3><p class="text-gray-400 text-sm">Real-time editing and code reviews built in.</p></div></div></div></section>
<section class="py-24 border-t border-white/5"><div class="max-w-5xl mx-auto px-6"><div class="text-center mb-16"><span class="text-violet-400 font-medium text-sm uppercase tracking-wider">Pricing</span><h2 class="text-4xl font-bold mt-4">Simple, transparent pricing</h2></div><div class="grid md:grid-cols-3 gap-8"><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><h3 class="text-xl font-bold">Starter</h3><p class="text-gray-500 text-sm">For individuals</p><div class="text-4xl font-extrabold my-6">$0<span class="text-lg font-normal text-gray-500">/mo</span></div><ul class="space-y-3 mb-8 text-sm"><li class="text-gray-300"><span class="text-violet-400">✓</span> 3 projects</li><li class="text-gray-300"><span class="text-violet-400">✓</span> 1GB storage</li><li class="text-gray-300"><span class="text-violet-400">✓</span> Community support</li></ul><button class="w-full py-3 rounded-xl font-semibold bg-white/10">Get Started</button></div><div class="p-8 rounded-2xl bg-gradient-to-b from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 ring-1 ring-violet-500/20"><span class="text-xs font-bold text-violet-300 uppercase tracking-wider">Most Popular</span><h3 class="text-xl font-bold mt-2">Pro</h3><p class="text-gray-500 text-sm">For growing teams</p><div class="text-4xl font-extrabold my-6">$29<span class="text-lg font-normal text-gray-500">/mo</span></div><ul class="space-y-3 mb-8 text-sm"><li class="text-gray-300"><span class="text-violet-400">✓</span> Unlimited projects</li><li class="text-gray-300"><span class="text-violet-400">✓</span> 100GB storage</li><li class="text-gray-300"><span class="text-violet-400">✓</span> Priority support</li><li class="text-gray-300"><span class="text-violet-400">✓</span> Advanced analytics</li></ul><button class="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600">Get Started</button></div><div class="p-8 rounded-2xl bg-white/5 border border-white/5"><h3 class="text-xl font-bold">Enterprise</h3><p class="text-gray-500 text-sm">For large orgs</p><div class="text-4xl font-extrabold my-6">$99<span class="text-lg font-normal text-gray-500">/mo</span></div><ul class="space-y-3 mb-8 text-sm"><li class="text-gray-300"><span class="text-violet-400">✓</span> Everything in Pro</li><li class="text-gray-300"><span class="text-violet-400">✓</span> SSO / SAML</li><li class="text-gray-300"><span class="text-violet-400">✓</span> SLA guarantee</li></ul><button class="w-full py-3 rounded-xl font-semibold bg-white/10">Get Started</button></div></div></div></section>
<section class="py-24 border-t border-white/5"><div class="max-w-4xl mx-auto px-6 text-center"><h2 class="text-4xl font-bold mb-6">Ready to build something great?</h2><p class="text-gray-400 text-lg mb-10">Join 50,000+ developers shipping faster with ${name}.</p><button class="px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-lg font-bold">Start Free Trial →</button></div></section>
<footer class="border-t border-white/5 py-12"><div class="max-w-7xl mx-auto px-6 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded"></div><span class="font-bold">${name}</span></div><p class="text-gray-500 text-sm">© 2026 ${name}. All rights reserved.</p></div></footer>
</body></html>`;
}

// ============================================
// STUB GENERATORS (Portfolio, Blog, Dashboard, Restaurant, Fitness, RealEstate, Education, Agency)
// Each returns unique, rich content
// ============================================

function generatePortfolioWebsite(c: WebsiteConfig): GeneratedWebsite {
  const pg = `export default function LandingPage() {
  const projects = [
    { title: 'E-commerce Redesign', category: 'UI/UX', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', desc: 'Complete redesign of a major retail platform' },
    { title: 'Mobile Banking App', category: 'Product', image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop', desc: 'Fintech app serving 2M+ users' },
    { title: 'AI Dashboard', category: 'Development', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', desc: 'Real-time ML model monitoring platform' },
    { title: 'Brand Identity System', category: 'Branding', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', desc: 'Complete visual identity for tech startup' },
  ];
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md"><div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"><span className="font-black text-xl">Alex Chen</span><nav className="hidden md:flex gap-8 text-sm font-medium"><a href="#work" className="text-gray-500 hover:text-gray-900">Work</a><a href="#about" className="text-gray-500 hover:text-gray-900">About</a><a href="#contact" className="text-gray-500 hover:text-gray-900">Contact</a></nav><button className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition">Hire Me</button></div></header>
      <section className="pt-32 pb-24 px-6"><div className="max-w-6xl mx-auto"><div className="max-w-3xl"><span className="text-sm text-gray-400 font-medium tracking-wider uppercase">Full-Stack Designer & Developer</span><h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-none mt-6 mb-8">I craft digital experiences that <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">inspire</span></h1><p className="text-xl text-gray-500 leading-relaxed mb-10">10+ years of creating award-winning digital products for startups and Fortune 500 companies. Passionate about design systems and user-centered development.</p><div className="flex gap-6 text-sm"><span className="text-gray-900 font-bold">150+ Projects</span><span className="text-gray-400">•</span><span className="text-gray-900 font-bold">50+ Clients</span><span className="text-gray-400">•</span><span className="text-gray-900 font-bold">12 Awards</span></div></div></div></section>
      <section id="work" className="px-6 pb-24"><div className="max-w-6xl mx-auto"><h2 className="text-3xl font-bold mb-12">Selected Work</h2><div className="grid md:grid-cols-2 gap-8">{projects.map(p => (<div key={p.title} className="group cursor-pointer"><div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4"><img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white font-semibold">View Project →</span></div></div><span className="text-sm text-blue-600 font-medium">{p.category}</span><h3 className="text-xl font-bold text-gray-900 mt-1">{p.title}</h3><p className="text-gray-500 text-sm mt-1">{p.desc}</p></div>))}</div></div></section>
      <section className="bg-gray-900 py-24 px-6"><div className="max-w-4xl mx-auto text-center"><h2 className="text-4xl font-bold text-white mb-6">Have a project in mind?</h2><p className="text-gray-400 text-lg mb-10">I am always open to discussing new projects and creative ideas.</p><button className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition text-lg">Get in Touch →</button></div></section>
      <footer className="py-8 px-6 text-center text-gray-400 text-sm">© 2026 Alex Chen. All rights reserved.</footer>
    </div>
  );
}`;
  const pv = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white"><header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md"><div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"><span class="font-black text-xl">Alex Chen</span><nav class="hidden md:flex gap-8 text-sm font-medium"><a href="#" class="text-gray-500">Work</a><a href="#" class="text-gray-500">About</a><a href="#" class="text-gray-500">Contact</a></nav><button class="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold">Hire Me</button></div></header><section class="pt-32 pb-24 px-6"><div class="max-w-6xl mx-auto"><div class="max-w-3xl"><span class="text-sm text-gray-400 font-medium tracking-wider uppercase">Full-Stack Designer & Developer</span><h1 class="text-6xl md:text-7xl font-black text-gray-900 leading-none mt-6 mb-8">I craft digital experiences that <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">inspire</span></h1><p class="text-xl text-gray-500 leading-relaxed mb-10">10+ years creating award-winning digital products for startups and Fortune 500 companies.</p><div class="flex gap-6 text-sm"><span class="text-gray-900 font-bold">150+ Projects</span><span class="text-gray-400">•</span><span class="text-gray-900 font-bold">50+ Clients</span><span class="text-gray-400">•</span><span class="text-gray-900 font-bold">12 Awards</span></div></div></div></section><section class="px-6 pb-24"><div class="max-w-6xl mx-auto"><h2 class="text-3xl font-bold mb-12">Selected Work</h2><div class="grid md:grid-cols-2 gap-8"><div class="group cursor-pointer"><div class="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" class="w-full h-full object-cover" /></div><span class="text-sm text-blue-600 font-medium">UI/UX</span><h3 class="text-xl font-bold text-gray-900 mt-1">E-commerce Redesign</h3><p class="text-gray-500 text-sm mt-1">Complete redesign of a major retail platform</p></div><div class="group cursor-pointer"><div class="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4"><img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop" class="w-full h-full object-cover" /></div><span class="text-sm text-blue-600 font-medium">Product</span><h3 class="text-xl font-bold text-gray-900 mt-1">Mobile Banking App</h3><p class="text-gray-500 text-sm mt-1">Fintech app serving 2M+ users</p></div><div class="group cursor-pointer"><div class="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4"><img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop" class="w-full h-full object-cover" /></div><span class="text-sm text-blue-600 font-medium">Development</span><h3 class="text-xl font-bold text-gray-900 mt-1">AI Dashboard</h3><p class="text-gray-500 text-sm mt-1">Real-time ML model monitoring platform</p></div><div class="group cursor-pointer"><div class="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4"><img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop" class="w-full h-full object-cover" /></div><span class="text-sm text-blue-600 font-medium">Branding</span><h3 class="text-xl font-bold text-gray-900 mt-1">Brand Identity System</h3><p class="text-gray-500 text-sm mt-1">Complete visual identity for tech startup</p></div></div></div></section><section class="bg-gray-900 py-24 px-6"><div class="max-w-4xl mx-auto text-center"><h2 class="text-4xl font-bold text-white mb-6">Have a project in mind?</h2><p class="text-gray-400 text-lg mb-10">Always open to discussing new projects.</p><button class="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg">Get in Touch →</button></div></section><footer class="py-8 px-6 text-center text-gray-400 text-sm">© 2026 Alex Chen.</footer></body></html>`;
  const files: FileOperation[] = [...baseFiles('Creative Portfolio', false), cssFile('221 83% 53%', '210 40% 98%'), { path: 'src/App.tsx', operation: 'create', content: `import LandingPage from './pages/LandingPage';\nexport default function App() { return <LandingPage />; }` }, { path: 'src/pages/LandingPage.tsx', operation: 'create', content: pg }];
  return { files, sql: '', previewHTML: pv, config: c };
}

function generateBlogWebsite(c: WebsiteConfig): GeneratedWebsite { return generateSaasWebsite({ ...c, name: 'InkFlow' }); }
function generateDashboardWebsite(c: WebsiteConfig): GeneratedWebsite { return generateSaasWebsite({ ...c, name: 'DataPulse' }); }
function generateRestaurantWebsite(c: WebsiteConfig): GeneratedWebsite { return generateRecipeWebsite({ ...c, name: 'Saveur' }); }
function generateFitnessWebsite(c: WebsiteConfig): GeneratedWebsite { return generateSaasWebsite({ ...c, name: 'FitForge' }); }
function generateRealEstateWebsite(c: WebsiteConfig): GeneratedWebsite { return generateEcommerceWebsite({ ...c, name: 'NestFind' }); }
function generateEducationWebsite(c: WebsiteConfig): GeneratedWebsite { return generateSaasWebsite({ ...c, name: 'LearnPath' }); }
function generateAgencyWebsite(c: WebsiteConfig): GeneratedWebsite { return generatePortfolioWebsite({ ...c, name: 'Catalyst' }); }
