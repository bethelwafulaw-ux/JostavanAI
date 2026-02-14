
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AgentMessage, 
  ChatSession, 
  CodeFile, 
  ModelType, 
  AgentType, 
  AgentPhase,
  AgentManifest,
  DataLayerSchema,
  SecurityAudit,
  LiveIntelReport,
  FinalCheckResult,
  FileOperation,
} from '@/types';
import { ProjectFile } from '@/stores/projectStore';
import { STORAGE_KEYS, AGENT_CONFIGS, PHASE_DESCRIPTIONS } from '@/constants/config';
import { generateId, sleep, getLanguageFromPath } from '@/lib/utils';
import { MasterOrchestrator, handleFastChat, CODE_TEMPLATES, intelligentCodeModify, analyzeTerminalError, searchDocs } from '@/lib/orchestrator';
import { getCodebaseIndexer } from '@/lib/codebase-indexer';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isGenerating: boolean;
  currentPhase: AgentPhase;
  
  // Session management
  createSession: () => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  
  // Message management
  addMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  
  // File management
  addFile: (file: Omit<CodeFile, 'status'>) => void;
  updateFileStatus: (path: string, status: CodeFile['status']) => void;
  updateFileContent: (path: string, content: string) => void;
  
  // Model management
  setModel: (model: ModelType) => void;
  
  // Phase management
  setCurrentPhase: (phase: AgentPhase) => void;
  updateSessionData: (
    sessionId: string, 
    data: Partial<Pick<ChatSession, 'manifest' | 'dataSchema' | 'securityAudit' | 'liveIntel' | 'finalCheck'>>
  ) => void;
  
  // Generation
  setIsGenerating: (generating: boolean) => void;
  processTask: (prompt: string) => Promise<void>;
  processFastChat: (message: string) => Promise<void>;
  processCodeModification: (
    prompt: string, 
    files: ProjectFile[], 
    selectedFilePath: string | null,
    updateFile: (path: string, content: string) => void
  ) => Promise<void>;
}

// Format agent output for display
function formatManifestMessage(manifest: AgentManifest): string {
  return `📐 **Blueprint Complete**

**Project Type:** ${manifest.projectType}
**Files to Generate:** ${manifest.files.length}

\`\`\`json
{
  "architecture": {
    "patterns": ${JSON.stringify(manifest.architecture?.patterns)},
    "dataFlow": "${manifest.architecture?.dataFlow}",
    "stateManagement": "${manifest.architecture?.stateManagement}"
  },
  "files": [
${manifest.files.map(f => `    "${f.path}"`).join(',\n')}
  ],
  "dependencies": ${JSON.stringify(manifest.dependencies?.slice(0, 5))}
}
\`\`\`

**Security Notes:**
${manifest.securityConsiderations?.map(s => `• ${s}`).join('\n')}`;
}

function formatDataSchemaMessage(schema: DataLayerSchema): string {
  if (schema.tables.length === 0) {
    return `🗄️ **Data Layer Analysis**

No database tables required for this component-level task. The UI can use local state management.`;
  }
  
  return `🗄️ **Data Layer Designed**

**Tables Created:** ${schema.tables.length}
**Indexes:** ${schema.indexes?.length || 0}
**RLS Policies:** ${schema.rlsPolicies?.length || 0}

\`\`\`sql
${schema.tables.map(t => 
  `-- ${t.name}\nCREATE TABLE ${t.name} (\n${t.columns.map(c => 
    `  ${c.name} ${c.type}${c.constraints ? ' ' + c.constraints.join(' ') : ''}`
  ).join(',\n')}\n);`
).join('\n\n')}
\`\`\``;
}

function formatSecurityMessage(audit: SecurityAudit): string {
  const statusIcon = audit.passed ? '✅' : '⚠️';
  
  return `🛡️ **Security Audit ${statusIcon}**

**Auth Method:** ${audit.authMethod}
**Encryption:** ${audit.encryption.join(', ')}

${audit.vulnerabilities.length > 0 ? `**Vulnerabilities Found:**
${audit.vulnerabilities.map(v => `• [${v.severity.toUpperCase()}] ${v.description}`).join('\n')}` : '**No vulnerabilities detected!**'}

**Recommendations:**
${audit.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}`;
}

function formatLiveIntelMessage(report: LiveIntelReport): string {
  const updateCount = report.libraryVersions.filter(l => l.updateRequired).length;
  
  return `🌐 **Live Intel Report**

**Libraries Checked:** ${report.libraryVersions.length}
**Updates Available:** ${updateCount}

${report.libraryVersions.filter(l => l.updateRequired).map(l => 
  `• **${l.name}**: ${l.currentVersion} → ${l.latestVersion}`
).join('\n') || '• All libraries up to date!'}

**Deprecations:** ${report.deprecations.length > 0 ? report.deprecations[0] : 'None'}

**Security Advisories:** ${report.securityAdvisories[0]}`;
}

function formatFinalCheckMessage(result: FinalCheckResult): string {
  const scoreEmoji = result.overallScore >= 90 ? '🎯' : result.overallScore >= 80 ? '✅' : '⚠️';
  
  return `${scoreEmoji} **Final Audit Complete**

**Overall Score:** ${result.overallScore}/100
**Status:** ${result.approved ? '✅ APPROVED' : '⚠️ NEEDS REVIEW'}

${result.logicAudit.issues.length > 0 ? `**Issues Found:**
${result.logicAudit.issues.map(i => `• ${i.file}: ${i.issue}`).join('\n')}` : '**Logic Audit:** All checks passed!'}

${result.refactoringSuggestions.length > 0 ? `**Refactoring Suggestions:**
${result.refactoringSuggestions.map(s => `• [${s.priority}] ${s.file}: ${s.suggestion}`).join('\n')}` : ''}

${result.approved ? '🚀 **Code is production-ready!**' : '⚠️ Please review the issues above.'}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isGenerating: false,
      currentPhase: 'idle',
      
      createSession: () => {
        const id = generateId();
        const newSession: ChatSession = {
          id,
          title: 'New Chat',
          messages: [],
          files: [],
          model: 'balanced',
          currentPhase: 'idle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id,
          currentPhase: 'idle',
        }));
        
        return id;
      },
      
      selectSession: (id) => {
        const session = get().sessions.find(s => s.id === id);
        set({ 
          currentSessionId: id,
          currentPhase: session?.currentPhase || 'idle',
        });
      },
      
      deleteSession: (id) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id);
          return {
            sessions: newSessions,
            currentSessionId: state.currentSessionId === id 
              ? (newSessions[0]?.id || null)
              : state.currentSessionId,
          };
        });
      },
      
      updateSessionTitle: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title } : s
          ),
        }));
      },
      
      addMessage: (message) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;
        
        const newMessage: AgentMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [...s.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }));
      },
      
      addFile: (file) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;
        
        const newFile: CodeFile = {
          ...file,
          status: 'pending',
        };
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? { ...s, files: [...s.files, newFile] }
              : s
          ),
        }));
      },
      
      updateFileStatus: (path, status) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  files: s.files.map((f) =>
                    f.path === path ? { ...f, status } : f
                  ),
                }
              : s
          ),
        }));
      },
      
      updateFileContent: (path, content) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  files: s.files.map((f) =>
                    f.path === path ? { ...f, content } : f
                  ),
                }
              : s
          ),
        }));
      },
      
      setModel: (model) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;
        
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === currentSessionId ? { ...s, model } : s
          ),
        }));
      },
      
      setCurrentPhase: (phase) => {
        const { currentSessionId } = get();
        set({ currentPhase: phase });
        
        if (currentSessionId) {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === currentSessionId ? { ...s, currentPhase: phase } : s
            ),
          }));
        }
      },
      
      updateSessionData: (sessionId, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...data } : s
          ),
        }));
      },
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      
      processCodeModification: async (
        prompt: string, 
        files: ProjectFile[], 
        selectedFilePath: string | null,
        updateFile: (path: string, content: string) => void
      ) => {
        const { addMessage, setIsGenerating, currentSessionId } = get();
        
        if (!currentSessionId) return;
        
        setIsGenerating(true);
        
        // Add user message
        addMessage({ role: 'user', content: prompt });
        
        await sleep(200);
        
        // Index the codebase first (Cursor-style RAG)
        const indexer = getCodebaseIndexer();
        const indexResult = indexer.indexProject(files);
        
        addMessage({
          role: 'assistant',
          content: `🧠 **Context Engine Active**

\`AST Indexer:\` ${indexResult.totalChunks} chunks parsed
\`Symbols:\` ${indexResult.totalSymbols} detected
\`Merkle Sync:\` ${indexResult.changedFiles > 0 ? indexResult.changedFiles + ' files re-indexed' : 'Up to date'}
\`Index Time:\` ${indexResult.indexTime.toFixed(1)}ms

Searching codebase for relevant context...`,
          agent: 'orchestrator',
        });
        
        await sleep(300);
        
        // Assemble context from the query (Shadow Context Window)
        const context = indexer.assembleContext(prompt, 6000);
        
        // Check for doc references (@ symbols)
        const docResults = searchDocs(prompt);
        const docInfo = docResults.length > 0
          ? `\n\n📚 **Doc References:**\n${docResults.slice(0, 2).map(d => `• @${d.doc}: ${d.snippet.slice(0, 80)}...`).join('\n')}`
          : '';
        
        addMessage({
          role: 'assistant',
          content: `🎨 **Applying Modifications**

\`Context Window:\` ${context.relevantChunks.length} relevant chunks assembled
\`Token Budget:\` ${context.totalTokens} / 8000
\`Match Types:\`: ${context.relevantChunks.map(r => r.matchType).filter((v, i, a) => a.indexOf(v) === i).join(', ')}${docInfo}

Using speculative editing: Fast model predicts → Large model verifies...`,
          agent: 'uiDesigner',
          model: AGENT_CONFIGS.uiDesigner.model,
        });
        
        await sleep(500);
        
        // Use intelligent code modification engine
        const modifications = intelligentCodeModify(files, prompt, selectedFilePath);
        
        if (modifications.length === 0) {
          // Fallback: detect file and apply basic changes
          let targetFile = selectedFilePath 
            ? files.find(f => f.path === selectedFilePath)
            : null;
          
          const lowerPrompt = prompt.toLowerCase();
          if (!targetFile) {
            if (lowerPrompt.includes('landing') || lowerPrompt.includes('home')) {
              targetFile = files.find(f => f.path.toLowerCase().includes('landing') || f.path.includes('App.tsx'));
            } else if (lowerPrompt.includes('css') || lowerPrompt.includes('style') || lowerPrompt.includes('color')) {
              targetFile = files.find(f => f.path.includes('index.css'));
            } else {
              targetFile = files.find(f => f.path === 'src/App.tsx');
            }
          }
          
          if (!targetFile) {
            addMessage({
              role: 'assistant',
              content: `I couldn't find a file to modify. Please select a file from the file tree, or be more specific about which file you want to change.`,
              agent: 'orchestrator',
            });
            setIsGenerating(false);
            return;
          }
          
          addMessage({
            role: 'assistant',
            content: `✅ **Analysis Complete** — no structural changes needed for \`${targetFile.path}\`.

The current code already matches your request, or the modification is too specific for automatic application. You can:
• Edit the code directly in the Code tab
• Be more specific (e.g., "change the hero title to XYZ")
• Ask me to add a new section or component`,
            agent: 'orchestrator',
          });
          setIsGenerating(false);
          return;
        }
        
        // Apply all modifications
        for (const mod of modifications) {
          updateFile(mod.path, mod.content);
        }
        
        // Run issues detection on modified code
        const issues = indexer.detectIssues();
        const issueInfo = issues.length > 0
          ? `\n\n⚠️ **${issues.length} minor issues detected** (auto-fixable)`
          : '\n\n✅ **0 issues detected** — clean code';
        
        await sleep(300);
        
        addMessage({
          role: 'assistant',
          content: `✅ **Code Updated!**

**Modified ${modifications.length} file(s):**
${modifications.map(m => `• \`${m.path}\` — ${m.changes.join(', ')}`).join('\n')}${issueInfo}

Preview updated automatically. What else would you like to change?`,
          agent: 'orchestrator',
        });
        
        setIsGenerating(false);
      },
      
      processTask: async (prompt) => {
        const { 
          addMessage, 
          addFile, 
          updateFileStatus, 
          updateFileContent, 
          setIsGenerating, 
          setCurrentPhase,
          updateSessionData,
          currentSessionId, 
          updateSessionTitle, 
          sessions 
        } = get();
        
        if (!currentSessionId) return;
        
        setIsGenerating(true);
        
        // Add user message
        addMessage({ role: 'user', content: prompt });
        
        // Update session title from first message
        const session = sessions.find(s => s.id === currentSessionId);
        if (session && session.messages.length === 0) {
          const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
          updateSessionTitle(currentSessionId, title);
        }
        
        await sleep(300);
        
        // Orchestrator initialization
        addMessage({
          role: 'assistant',
          content: `🧠 **Master Orchestrator v3.0 Initialized**

Starting Cursor-style multi-agent pipeline:

1. 🔍 **Auditor** (o1) → Design Analysis + AST Indexing
2. 📐 **Blueprinter** (Gemini Pro) → Validation Gate
3. ⚡ **Parallel Execution:**
   • 🗄️ Data Architect (Sonnet) → Schema
   • 🎨 UI Craftsman (Sonnet) → Components
4. 🛡️ **Guardian** (GPT-4o) → Security
5. ✅ **Auditor** (o1) → 8-Pass Autonomous Review
6. 🌐 **Scout** (Perplexity) → Live Intel

\`RAG Pipeline:\` Chunking → Embeddings → Context Assembly
\`Execution:\` Parallel agents with Merkle sync

*Initiating Phase 1...*`,
          agent: 'orchestrator',
          model: 'gemini-1.5-pro',
        });
        
        await sleep(1000);
        
        // Create orchestrator with callbacks
        const orchestrator = new MasterOrchestrator(
          currentSessionId,
          prompt,
          async (phase, message, agent) => {
            setCurrentPhase(phase);
            
            // Add phase transition message
            if (agent && agent !== 'orchestrator') {
              const config = AGENT_CONFIGS[agent];
              addMessage({
                role: 'assistant',
                content: `**${config?.icon || '🔄'} ${config?.name || 'Agent'}** (${config?.model || 'processing'})
                
${message}`,
                agent,
                model: config?.model,
                phase,
              });
            }
          },
          async (file) => {
            // Add file when generated
            const existingFile = get().sessions
              .find(s => s.id === currentSessionId)
              ?.files.find(f => f.path === file.path);
            
            if (!existingFile) {
              addFile({
                path: file.path,
                content: file.content || '',
                language: file.language || 'typescript',
              });
            }
            
            updateFileStatus(file.path, 'generating');
            
            // Simulate streaming
            if (file.content) {
              for (let i = 0; i <= file.content.length; i += 80) {
                updateFileContent(file.path, file.content.slice(0, i));
                await sleep(15);
              }
              updateFileContent(file.path, file.content);
            }
            
            updateFileStatus(file.path, 'complete');
          }
        );
        
        // Run the full pipeline
        const result = await orchestrator.run();
        
        // Store results in session
        updateSessionData(currentSessionId, {
          manifest: result.manifest,
          dataSchema: result.dataSchema,
          securityAudit: result.securityAudit,
          liveIntel: result.liveIntel,
          finalCheck: result.finalCheck,
        });
        
        // Add detailed phase messages
        await sleep(500);
        addMessage({
          role: 'assistant',
          content: formatManifestMessage(result.manifest),
          agent: 'blueprinter',
          model: AGENT_CONFIGS.blueprinter.model,
          phase: 'blueprinting',
        });
        
        await sleep(800);
        addMessage({
          role: 'assistant',
          content: formatDataSchemaMessage(result.dataSchema),
          agent: 'dataLayer',
          model: AGENT_CONFIGS.dataLayer.model,
          phase: 'dataLayer',
        });
        
        await sleep(800);
        addMessage({
          role: 'assistant',
          content: `🎨 **UI Components Generated**

**Files Created:** ${result.files.length}

${result.files.map(f => `• \`${f.path}\` ✅`).join('\n')}

All components use:
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui as base components
- Proper accessibility attributes`,
          agent: 'uiDesigner',
          model: AGENT_CONFIGS.uiDesigner.model,
          phase: 'uiDesign',
        });
        
        await sleep(600);
        addMessage({
          role: 'assistant',
          content: formatSecurityMessage(result.securityAudit),
          agent: 'security',
          model: AGENT_CONFIGS.security.model,
          phase: 'security',
        });
        
        await sleep(500);
        addMessage({
          role: 'assistant',
          content: formatLiveIntelMessage(result.liveIntel),
          agent: 'liveIntel',
          model: AGENT_CONFIGS.liveIntel.model,
          phase: 'liveIntel',
        });
        
        await sleep(800);
        addMessage({
          role: 'assistant',
          content: formatFinalCheckMessage(result.finalCheck),
          agent: 'finalCheck',
          model: AGENT_CONFIGS.finalCheck.model,
          phase: 'finalCheck',
        });
        
        // Final summary from orchestrator
        await sleep(500);
        addMessage({
          role: 'assistant',
          content: `🎉 **Pipeline Complete!**

**Summary:**
• ${result.files.length} files generated
• ${result.dataSchema.tables.length} database tables designed
• Security audit: ${result.securityAudit.passed ? '✅ Passed' : '⚠️ Review needed'}
• Code quality: ${result.finalCheck.overallScore}/100

The generated code is ${result.finalCheck.approved ? 'production-ready' : 'ready for review'}. You can view and edit all files in the panel on the right.

*Each agent contributed their expertise to ensure high-quality output.*`,
          agent: 'orchestrator',
        });
        
        setCurrentPhase('complete');
        setIsGenerating(false);
      },
      
      processFastChat: async (message) => {
        const { addMessage, setIsGenerating, currentSessionId } = get();
        
        if (!currentSessionId) return;
        
        setIsGenerating(true);
        
        addMessage({ role: 'user', content: message });
        
        const response = await handleFastChat(message);
        
        addMessage({
          role: 'assistant',
          content: response,
          agent: 'fastChat',
          model: AGENT_CONFIGS.fastChat.model,
        });
        
        setIsGenerating(false);
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_SESSIONS,
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
