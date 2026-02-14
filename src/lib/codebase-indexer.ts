/**
 * Jostavan AI - High-Fidelity Codebase Indexer
 * 
 * Cursor-style "RAG" Pipeline for code intelligence:
 * 
 * 1. Tree-sitter-like AST Chunking
 *    - Parses code into logical boundaries (functions, classes, components)
 *    - Never breaks a "complete thought" in half
 * 
 * 2. Vector Embeddings (TF-IDF based semantic search)
 *    - Converts chunks into numerical vectors
 *    - Finds closest matches via cosine similarity
 * 
 * 3. Merkle Tree Syncing
 *    - Detects exactly which files changed via content hashing
 *    - Only re-indexes touched snippets
 * 
 * 4. Context Assembly (Shadow Context Window)
 *    - Assembles the most relevant code snippets for any prompt
 *    - Makes the AI "know" the entire codebase
 */

import { ProjectFile } from '@/stores/projectStore';

// ============================================
// TYPES
// ============================================

export interface CodeChunk {
  id: string;
  filePath: string;
  type: 'component' | 'function' | 'hook' | 'class' | 'interface' | 'type' | 'import' | 'constant' | 'export' | 'style' | 'sql' | 'config' | 'jsx-block' | 'unknown';
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  dependencies: string[];  // imports used by this chunk
  exports: string[];        // what this chunk exports
  tokens: string[];         // tokenized words for search
  vector: number[];         // TF-IDF vector
  hash: string;             // content hash for Merkle sync
  metadata: {
    hasJSX: boolean;
    hasHooks: boolean;
    hasTailwind: boolean;
    complexity: number;      // cyclomatic complexity estimate
    lineCount: number;
  };
}

export interface FileIndex {
  path: string;
  hash: string;
  chunks: CodeChunk[];
  symbols: SymbolEntry[];
  lastIndexed: number;
}

export interface SymbolEntry {
  name: string;
  type: 'component' | 'function' | 'hook' | 'class' | 'interface' | 'type' | 'constant' | 'variable';
  filePath: string;
  line: number;
  exported: boolean;
  references: string[];  // file paths that reference this symbol
}

export interface SearchResult {
  chunk: CodeChunk;
  score: number;
  matchType: 'exact' | 'semantic' | 'structural';
}

export interface ContextPackage {
  query: string;
  relevantChunks: SearchResult[];
  symbolMap: Map<string, SymbolEntry>;
  fileGraph: Map<string, string[]>;  // file -> files it imports
  totalTokens: number;
  assembledContext: string;
}

// ============================================
// CONTENT HASHING (Merkle Tree)
// ============================================

function hashContent(content: string): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime
  }
  return hash.toString(16).padStart(8, '0');
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return '00000000';
  if (hashes.length === 1) return hashes[0];
  
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    nextLevel.push(hashContent(left + right));
  }
  return computeMerkleRoot(nextLevel);
}

// ============================================
// AST-LIKE PARSER (Tree-sitter simulation)
// ============================================

function parseToChunks(filePath: string, content: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const lines = content.split('\n');
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  if (!content.trim()) return chunks;
  
  // Language-specific parsing
  if (ext === 'tsx' || ext === 'jsx' || ext === 'ts' || ext === 'js') {
    chunks.push(...parseTypeScriptAST(filePath, content, lines));
  } else if (ext === 'css' || ext === 'scss') {
    chunks.push(...parseCSSAST(filePath, content, lines));
  } else if (ext === 'sql') {
    chunks.push(...parseSQLAST(filePath, content, lines));
  } else if (ext === 'json') {
    chunks.push(...parseJSONAST(filePath, content, lines));
  } else {
    // Generic: treat whole file as one chunk
    chunks.push(createChunk(filePath, 'unknown', filePath.split('/').pop() || 'file', content, 0, lines.length - 1));
  }
  
  return chunks;
}

function parseTypeScriptAST(filePath: string, content: string, lines: string[]): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  
  // 1. Extract imports block
  const importLines: string[] = [];
  let importEnd = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') || (importLines.length > 0 && (line.startsWith('}') || line.includes("from '")))) {
      importLines.push(lines[i]);
      importEnd = i;
    } else if (importLines.length > 0 && !line) {
      continue; // skip blank lines between imports
    } else if (importLines.length > 0) {
      break;
    }
  }
  
  if (importLines.length > 0) {
    chunks.push(createChunk(filePath, 'import', 'imports', importLines.join('\n'), 0, importEnd));
  }
  
  // 2. Extract interfaces and types
  const interfaceRegex = /^(export\s+)?(interface|type)\s+(\w+)/;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(interfaceRegex);
    if (match) {
      const end = findBlockEnd(lines, i);
      const block = lines.slice(i, end + 1).join('\n');
      chunks.push(createChunk(filePath, match[2] === 'interface' ? 'interface' : 'type', match[3], block, i, end));
      i = end;
    }
  }
  
  // 3. Extract functions and components
  const funcRegex = /^(export\s+)?(default\s+)?(async\s+)?function\s+(\w+)/;
  const arrowFuncRegex = /^(export\s+)?(const|let)\s+(\w+)\s*[=:]\s*(.*?)\s*=>/;
  const constFuncRegex = /^(export\s+)?(const|let)\s+(\w+)\s*=\s*\(.*?\)\s*(?:=>|:)/;
  const reactComponentRegex = /^(export\s+)?(default\s+)?function\s+(\w+)\s*\(/;
  
  for (let i = importEnd + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip already-captured interfaces/types
    if (trimmed.match(interfaceRegex)) {
      i = findBlockEnd(lines, i);
      continue;
    }
    
    let funcName = '';
    let chunkType: CodeChunk['type'] = 'function';
    
    const funcMatch = trimmed.match(funcRegex) || trimmed.match(reactComponentRegex);
    const arrowMatch = trimmed.match(arrowFuncRegex) || trimmed.match(constFuncRegex);
    
    if (funcMatch) {
      funcName = funcMatch[4] || funcMatch[3] || '';
      // Detect React components (PascalCase)
      if (funcName && funcName[0] === funcName[0].toUpperCase() && funcName[0] !== funcName[0].toLowerCase()) {
        chunkType = 'component';
      }
      // Detect hooks
      if (funcName.startsWith('use')) {
        chunkType = 'hook';
      }
    } else if (arrowMatch) {
      funcName = arrowMatch[3];
      if (funcName && funcName[0] === funcName[0].toUpperCase()) {
        chunkType = 'component';
      }
      if (funcName.startsWith('use')) {
        chunkType = 'hook';
      }
    }
    
    if (funcName) {
      const end = findBlockEnd(lines, i);
      const block = lines.slice(i, end + 1).join('\n');
      chunks.push(createChunk(filePath, chunkType, funcName, block, i, end));
      i = end;
      continue;
    }
    
    // 4. Extract constants (arrays, objects)
    const constRegex = /^(export\s+)?const\s+(\w+)\s*[=:]\s*[\[{]/;
    const constMatch = trimmed.match(constRegex);
    if (constMatch) {
      const end = findBlockEnd(lines, i);
      const block = lines.slice(i, end + 1).join('\n');
      chunks.push(createChunk(filePath, 'constant', constMatch[2], block, i, end));
      i = end;
    }
  }
  
  return chunks;
}

function parseCSSAST(filePath: string, content: string, lines: string[]): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  
  // Extract @layer blocks, :root, and media queries
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    
    if (trimmed.startsWith('@layer') || trimmed.startsWith(':root') || trimmed.startsWith('.dark') || trimmed.startsWith('@media')) {
      const name = trimmed.split(/[\s{]/)[0] + (trimmed.includes('base') ? ' base' : '');
      const end = findBlockEnd(lines, i);
      const block = lines.slice(i, end + 1).join('\n');
      chunks.push(createChunk(filePath, 'style', name, block, i, end));
      i = end;
    }
  }
  
  // If no chunks found, treat whole file as one
  if (chunks.length === 0) {
    chunks.push(createChunk(filePath, 'style', filePath.split('/').pop() || 'styles', content, 0, lines.length - 1));
  }
  
  return chunks;
}

function parseSQLAST(filePath: string, content: string, lines: string[]): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  const statements = content.split(/;\s*\n/);
  let lineOffset = 0;
  
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;
    
    const stmtLines = stmt.split('\n').length;
    const nameMatch = trimmed.match(/CREATE\s+(?:TABLE|INDEX|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/i);
    const name = nameMatch ? nameMatch[1] : 'statement';
    
    chunks.push(createChunk(filePath, 'sql', name, trimmed, lineOffset, lineOffset + stmtLines - 1));
    lineOffset += stmtLines;
  }
  
  return chunks;
}

function parseJSONAST(filePath: string, content: string, lines: string[]): CodeChunk[] {
  return [createChunk(filePath, 'config', filePath.split('/').pop() || 'config', content, 0, lines.length - 1)];
}

function findBlockEnd(lines: string[], startLine: number): number {
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let started = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    // Skip strings and comments (simplified)
    const cleaned = line.replace(/\/\/.*$/, '').replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/`[^`]*`/g, '');
    
    for (const char of cleaned) {
      if (char === '{') { braceCount++; started = true; }
      if (char === '}') braceCount--;
      if (char === '(') { parenCount++; started = true; }
      if (char === ')') parenCount--;
      if (char === '[') { bracketCount++; started = true; }
      if (char === ']') bracketCount--;
    }
    
    // Block ends when all counts return to 0 after starting
    if (started && braceCount <= 0 && parenCount <= 0 && bracketCount <= 0) {
      return i;
    }
  }
  
  return lines.length - 1;
}

function createChunk(filePath: string, type: CodeChunk['type'], name: string, content: string, startLine: number, endLine: number): CodeChunk {
  const tokens = tokenize(content);
  const deps = extractDependencies(content);
  const exports = extractExports(content);
  
  return {
    id: `${filePath}:${name}:${startLine}`,
    filePath,
    type,
    name,
    content,
    startLine,
    endLine,
    dependencies: deps,
    exports,
    tokens,
    vector: [], // computed later
    hash: hashContent(content),
    metadata: {
      hasJSX: /<\w/.test(content) && />/.test(content),
      hasHooks: /use[A-Z]/.test(content),
      hasTailwind: /className/.test(content),
      complexity: estimateComplexity(content),
      lineCount: endLine - startLine + 1,
    },
  };
}

function tokenize(content: string): string[] {
  return content
    .replace(/[^\w\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
  'one', 'our', 'out', 'has', 'his', 'how', 'its', 'let', 'may', 'new', 'now', 'old',
  'see', 'way', 'who', 'did', 'get', 'has', 'him', 'may', 'with', 'this', 'that',
  'from', 'have', 'been', 'said', 'each', 'will', 'there', 'their', 'what', 'about',
  'which', 'when', 'make', 'like', 'just', 'over', 'such', 'take', 'than', 'them',
  'very', 'after', 'would', 'these', 'other', 'into', 'could', 'your', 'return',
  'const', 'function', 'export', 'default', 'import', 'from', 'true', 'false', 'null',
  'undefined', 'string', 'number', 'boolean', 'void', 'class', 'interface', 'type',
]);

function extractDependencies(content: string): string[] {
  const deps: string[] = [];
  const importRegex = /import\s+(?:.*?)\s+from\s+['"](.+?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }
  return deps;
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  return exports;
}

function estimateComplexity(content: string): number {
  let complexity = 1;
  const patterns = [/if\s*\(/g, /else\s/g, /for\s*\(/g, /while\s*\(/g, /switch\s*\(/g, /\?\s*\w/g, /&&/g, /\|\|/g, /catch\s*\(/g];
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) complexity += matches.length;
  }
  return complexity;
}

// ============================================
// TF-IDF VECTOR EMBEDDINGS
// ============================================

class VectorStore {
  private idf: Map<string, number> = new Map();
  private documents: Map<string, string[]> = new Map(); // chunkId -> tokens
  
  buildIDF(chunks: CodeChunk[]) {
    const docCount = chunks.length;
    const termDocFreq = new Map<string, number>();
    
    for (const chunk of chunks) {
      const uniqueTokens = new Set(chunk.tokens);
      for (const token of uniqueTokens) {
        termDocFreq.set(token, (termDocFreq.get(token) || 0) + 1);
      }
      this.documents.set(chunk.id, chunk.tokens);
    }
    
    for (const [term, freq] of termDocFreq) {
      this.idf.set(term, Math.log((docCount + 1) / (freq + 1)) + 1);
    }
  }
  
  computeTFIDF(tokens: string[]): number[] {
    const allTerms = Array.from(this.idf.keys());
    const termFreq = new Map<string, number>();
    
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }
    
    const maxFreq = Math.max(...termFreq.values(), 1);
    
    return allTerms.map(term => {
      const tf = (termFreq.get(term) || 0) / maxFreq;
      const idf = this.idf.get(term) || 0;
      return tf * idf;
    });
  }
  
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}

// ============================================
// MAIN CODEBASE INDEXER
// ============================================

export class CodebaseIndexer {
  private fileIndices: Map<string, FileIndex> = new Map();
  private allChunks: CodeChunk[] = [];
  private symbolTable: Map<string, SymbolEntry> = new Map();
  private fileGraph: Map<string, string[]> = new Map(); // file -> imports
  private vectorStore: VectorStore = new VectorStore();
  private merkleRoot: string = '';
  private indexVersion: number = 0;
  
  /**
   * Index the entire project codebase
   * Uses Merkle tree to detect changes and only re-index modified files
   */
  indexProject(files: ProjectFile[]): {
    totalChunks: number;
    totalSymbols: number;
    changedFiles: number;
    merkleRoot: string;
    indexTime: number;
  } {
    const startTime = performance.now();
    let changedFiles = 0;
    
    // Compute new hashes for all files
    const currentHashes: string[] = [];
    const fileHashMap = new Map<string, string>();
    
    for (const file of files) {
      if (file.type !== 'file' || !file.content) continue;
      const hash = hashContent(file.content);
      currentHashes.push(hash);
      fileHashMap.set(file.path, hash);
    }
    
    // Merkle tree comparison - detect which files changed
    const newMerkleRoot = computeMerkleRoot(currentHashes);
    const needsFullReindex = newMerkleRoot !== this.merkleRoot;
    
    if (needsFullReindex) {
      // Find specific changed files
      for (const file of files) {
        if (file.type !== 'file' || !file.content) continue;
        
        const existingIndex = this.fileIndices.get(file.path);
        const newHash = fileHashMap.get(file.path) || '';
        
        if (!existingIndex || existingIndex.hash !== newHash) {
          // File changed or is new - re-index it
          this.indexFile(file);
          changedFiles++;
        }
      }
      
      // Remove indices for deleted files
      for (const [path] of this.fileIndices) {
        if (!files.find(f => f.path === path)) {
          this.fileIndices.delete(path);
        }
      }
    }
    
    // Rebuild global chunk array and vectors
    this.allChunks = [];
    for (const [, index] of this.fileIndices) {
      this.allChunks.push(...index.chunks);
    }
    
    // Build TF-IDF vectors
    this.vectorStore.buildIDF(this.allChunks);
    for (const chunk of this.allChunks) {
      chunk.vector = this.vectorStore.computeTFIDF(chunk.tokens);
    }
    
    // Build symbol table
    this.buildSymbolTable();
    
    // Build file dependency graph
    this.buildFileGraph();
    
    this.merkleRoot = newMerkleRoot;
    this.indexVersion++;
    
    const indexTime = performance.now() - startTime;
    
    return {
      totalChunks: this.allChunks.length,
      totalSymbols: this.symbolTable.size,
      changedFiles,
      merkleRoot: this.merkleRoot,
      indexTime,
    };
  }
  
  private indexFile(file: ProjectFile) {
    const chunks = parseToChunks(file.path, file.content);
    const hash = hashContent(file.content);
    
    const fileIndex: FileIndex = {
      path: file.path,
      hash,
      chunks,
      symbols: [],
      lastIndexed: Date.now(),
    };
    
    // Extract symbols
    for (const chunk of chunks) {
      if (chunk.type !== 'import' && chunk.type !== 'unknown') {
        fileIndex.symbols.push({
          name: chunk.name,
          type: chunk.type === 'constant' ? 'constant' : chunk.type === 'component' ? 'component' : chunk.type === 'hook' ? 'function' : chunk.type as SymbolEntry['type'],
          filePath: file.path,
          line: chunk.startLine,
          exported: chunk.content.includes('export'),
          references: [],
        });
      }
    }
    
    this.fileIndices.set(file.path, fileIndex);
  }
  
  private buildSymbolTable() {
    this.symbolTable.clear();
    
    for (const [, index] of this.fileIndices) {
      for (const symbol of index.symbols) {
        this.symbolTable.set(`${symbol.filePath}:${symbol.name}`, symbol);
      }
    }
    
    // Build cross-references
    for (const chunk of this.allChunks) {
      for (const [key, symbol] of this.symbolTable) {
        if (chunk.filePath !== symbol.filePath && chunk.content.includes(symbol.name)) {
          symbol.references.push(chunk.filePath);
        }
      }
    }
  }
  
  private buildFileGraph() {
    this.fileGraph.clear();
    
    for (const [, index] of this.fileIndices) {
      const imports: string[] = [];
      for (const chunk of index.chunks) {
        if (chunk.type === 'import') {
          imports.push(...chunk.dependencies);
        }
      }
      this.fileGraph.set(index.path, imports);
    }
  }
  
  /**
   * Search the indexed codebase
   * Uses TF-IDF cosine similarity + keyword matching + structural analysis
   */
  search(query: string, maxResults: number = 10): SearchResult[] {
    const queryTokens = tokenize(query);
    const queryVector = this.vectorStore.computeTFIDF(queryTokens);
    
    const results: SearchResult[] = [];
    
    for (const chunk of this.allChunks) {
      let score = 0;
      let matchType: SearchResult['matchType'] = 'semantic';
      
      // 1. Exact name match (highest priority)
      const queryLower = query.toLowerCase();
      if (chunk.name.toLowerCase().includes(queryLower) || queryLower.includes(chunk.name.toLowerCase())) {
        score += 0.5;
        matchType = 'exact';
      }
      
      // 2. Vector similarity (semantic)
      if (chunk.vector.length > 0 && queryVector.length > 0) {
        const similarity = this.vectorStore.cosineSimilarity(queryVector, chunk.vector);
        score += similarity * 0.3;
      }
      
      // 3. Keyword overlap
      const querySet = new Set(queryTokens);
      const overlapCount = chunk.tokens.filter(t => querySet.has(t)).length;
      const keywordScore = queryTokens.length > 0 ? overlapCount / queryTokens.length : 0;
      score += keywordScore * 0.2;
      
      // 4. Structural bonuses
      if (chunk.type === 'component' && (queryLower.includes('ui') || queryLower.includes('page') || queryLower.includes('component'))) {
        score += 0.1;
        matchType = 'structural';
      }
      if (chunk.type === 'hook' && queryLower.includes('hook')) {
        score += 0.1;
        matchType = 'structural';
      }
      if (chunk.type === 'sql' && (queryLower.includes('database') || queryLower.includes('table') || queryLower.includes('schema'))) {
        score += 0.1;
        matchType = 'structural';
      }
      
      if (score > 0.05) {
        results.push({ chunk, score, matchType });
      }
    }
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }
  
  /**
   * Context Assembly - Shadow Context Window
   * Assembles the most relevant code snippets for a given query
   * Makes a limited context window feel like it knows the entire codebase
   */
  assembleContext(query: string, maxTokenBudget: number = 8000): ContextPackage {
    const searchResults = this.search(query, 15);
    
    // Budget allocation: prioritize high-scoring chunks
    const selectedChunks: SearchResult[] = [];
    let totalTokens = 0;
    
    for (const result of searchResults) {
      const chunkTokens = Math.ceil(result.chunk.content.length / 4); // ~4 chars per token
      if (totalTokens + chunkTokens <= maxTokenBudget) {
        selectedChunks.push(result);
        totalTokens += chunkTokens;
      }
    }
    
    // Build symbol map for selected chunks
    const symbolMap = new Map<string, SymbolEntry>();
    for (const result of selectedChunks) {
      const key = `${result.chunk.filePath}:${result.chunk.name}`;
      const symbol = this.symbolTable.get(key);
      if (symbol) {
        symbolMap.set(key, symbol);
      }
    }
    
    // Assemble context string
    const contextParts: string[] = [];
    contextParts.push(`// Query: "${query}"`);
    contextParts.push(`// ${selectedChunks.length} relevant code sections found\n`);
    
    for (const result of selectedChunks) {
      contextParts.push(`// --- ${result.chunk.filePath} (${result.chunk.type}: ${result.chunk.name}) [score: ${result.score.toFixed(2)}] ---`);
      contextParts.push(result.chunk.content);
      contextParts.push('');
    }
    
    return {
      query,
      relevantChunks: selectedChunks,
      symbolMap,
      fileGraph: this.fileGraph,
      totalTokens,
      assembledContext: contextParts.join('\n'),
    };
  }
  
  /**
   * Find all references to a symbol across the codebase
   */
  findReferences(symbolName: string): { filePath: string; line: number; context: string }[] {
    const refs: { filePath: string; line: number; context: string }[] = [];
    
    for (const chunk of this.allChunks) {
      if (chunk.content.includes(symbolName)) {
        const lines = chunk.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(symbolName)) {
            refs.push({
              filePath: chunk.filePath,
              line: chunk.startLine + i,
              context: lines[i].trim(),
            });
          }
        }
      }
    }
    
    return refs;
  }
  
  /**
   * Get a structural overview of the codebase
   */
  getCodebaseOverview(): {
    totalFiles: number;
    totalChunks: number;
    totalSymbols: number;
    componentCount: number;
    hookCount: number;
    functionCount: number;
    avgComplexity: number;
    fileTypes: Record<string, number>;
    largestFiles: { path: string; lines: number }[];
  } {
    const fileTypes: Record<string, number> = {};
    let totalComplexity = 0;
    let componentCount = 0;
    let hookCount = 0;
    let functionCount = 0;
    const fileSizes: { path: string; lines: number }[] = [];
    
    for (const [path, index] of this.fileIndices) {
      const ext = path.split('.').pop() || 'unknown';
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      
      let totalLines = 0;
      for (const chunk of index.chunks) {
        totalComplexity += chunk.metadata.complexity;
        totalLines += chunk.metadata.lineCount;
        
        if (chunk.type === 'component') componentCount++;
        if (chunk.type === 'hook') hookCount++;
        if (chunk.type === 'function') functionCount++;
      }
      
      fileSizes.push({ path, lines: totalLines });
    }
    
    fileSizes.sort((a, b) => b.lines - a.lines);
    
    return {
      totalFiles: this.fileIndices.size,
      totalChunks: this.allChunks.length,
      totalSymbols: this.symbolTable.size,
      componentCount,
      hookCount,
      functionCount,
      avgComplexity: this.allChunks.length > 0 ? totalComplexity / this.allChunks.length : 0,
      fileTypes,
      largestFiles: fileSizes.slice(0, 5),
    };
  }
  
  /**
   * Detect errors and issues in the codebase
   */
  detectIssues(): {
    type: 'error' | 'warning' | 'info';
    file: string;
    line: number;
    message: string;
    fix: string;
  }[] {
    const issues: { type: 'error' | 'warning' | 'info'; file: string; line: number; message: string; fix: string }[] = [];
    
    for (const chunk of this.allChunks) {
      const content = chunk.content;
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = chunk.startLine + i;
        
        // Check for common issues
        if (line.includes('console.log') && chunk.type !== 'config') {
          issues.push({
            type: 'warning',
            file: chunk.filePath,
            line: lineNum,
            message: 'console.log statement found - remove for production',
            fix: 'Remove or replace with proper logging',
          });
        }
        
        if (line.includes(' any') && (line.includes(': any') || line.includes('<any>'))) {
          issues.push({
            type: 'warning',
            file: chunk.filePath,
            line: lineNum,
            message: 'TypeScript `any` type used - consider using a specific type',
            fix: 'Replace `any` with a specific type or `unknown`',
          });
        }
        
        if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
          issues.push({
            type: 'info',
            file: chunk.filePath,
            line: lineNum,
            message: `Code marker found: ${line.trim().slice(0, 60)}`,
            fix: 'Address the TODO/FIXME item',
          });
        }
        
        // Detect unused imports (simplified)
        if (chunk.type === 'import' && line.includes('import')) {
          const importNameMatch = line.match(/import\s+(?:{([^}]+)}|(\w+))/);
          if (importNameMatch) {
            const names = (importNameMatch[1] || importNameMatch[2] || '').split(',').map(n => n.trim());
            for (const name of names) {
              if (name && !this.allChunks.some(c => c.filePath === chunk.filePath && c.type !== 'import' && c.content.includes(name))) {
                issues.push({
                  type: 'warning',
                  file: chunk.filePath,
                  line: lineNum,
                  message: `Potentially unused import: ${name}`,
                  fix: `Remove unused import '${name}'`,
                });
              }
            }
          }
        }
        
        // Detect accessibility issues
        if (chunk.metadata.hasJSX) {
          if (line.includes('<img') && !line.includes('alt=')) {
            issues.push({
              type: 'error',
              file: chunk.filePath,
              line: lineNum,
              message: 'Image missing alt attribute (accessibility)',
              fix: 'Add alt="description" to the <img> tag',
            });
          }
          
          if (line.includes('onClick') && line.includes('<div')) {
            issues.push({
              type: 'warning',
              file: chunk.filePath,
              line: lineNum,
              message: 'div with onClick - consider using <button> for accessibility',
              fix: 'Replace <div onClick> with <button onClick> for proper semantics',
            });
          }
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Smart auto-fix for detected issues
   * Returns modified file content with fixes applied
   */
  autoFix(filePath: string, content: string): { fixed: string; fixCount: number; fixes: string[] } {
    let fixed = content;
    const fixes: string[] = [];
    
    // Fix missing alt attributes
    const imgWithoutAlt = /<img\s+(?!.*alt=)([^>]+)>/g;
    if (imgWithoutAlt.test(fixed)) {
      fixed = fixed.replace(imgWithoutAlt, '<img alt="" $1>');
      fixes.push('Added missing alt attributes to images');
    }
    
    // Fix console.log (comment them out)
    if (fixed.includes('console.log(')) {
      fixed = fixed.replace(/(\s*)console\.log\(([^)]*)\);?/g, '$1// console.log($2);');
      fixes.push('Commented out console.log statements');
    }
    
    return { fixed, fixCount: fixes.length, fixes };
  }
  
  // Getters
  getChunksByFile(filePath: string): CodeChunk[] {
    return this.allChunks.filter(c => c.filePath === filePath);
  }
  
  getSymbolTable(): Map<string, SymbolEntry> {
    return this.symbolTable;
  }
  
  getFileGraph(): Map<string, string[]> {
    return this.fileGraph;
  }
  
  getIndexStats(): { version: number; merkleRoot: string; totalChunks: number; totalFiles: number } {
    return {
      version: this.indexVersion,
      merkleRoot: this.merkleRoot,
      totalChunks: this.allChunks.length,
      totalFiles: this.fileIndices.size,
    };
  }
}

// Singleton indexer instance
let _indexer: CodebaseIndexer | null = null;

export function getCodebaseIndexer(): CodebaseIndexer {
  if (!_indexer) {
    _indexer = new CodebaseIndexer();
  }
  return _indexer;
}

export function resetCodebaseIndexer(): void {
  _indexer = null;
}
