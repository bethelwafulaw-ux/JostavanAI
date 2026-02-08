import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  type: 'file' | 'folder';
  children?: ProjectFile[];
  isOpen?: boolean;
  isModified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SQLSchema {
  id: string;
  name: string;
  sql: string;
  tables: string[];
  createdAt: string;
}

export interface BackendConnection {
  id: string;
  name: string;
  type: 'supabase' | 'postgres' | 'mysql' | 'firebase';
  url: string;
  apiKey?: string;
  isConnected: boolean;
  connectedAt?: string;
}

export interface GitHubConnection {
  username: string;
  accessToken: string;
  isConnected: boolean;
  connectedAt?: string;
  repos?: { name: string; url: string; isPrivate: boolean }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  sqlSchemas: SQLSchema[];
  backendConnection?: BackendConnection;
  githubConnection?: GitHubConnection;
  currentRepo?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  selectedFilePath: string | null;
  expandedFolders: Set<string>;
  
  // Project management
  createProject: (name: string, description?: string) => string;
  selectProject: (id: string) => void;
  deleteProject: (id: string) => void;
  getCurrentProject: () => Project | null;
  
  // File management
  addFile: (path: string, content: string, language: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  selectFile: (path: string | null) => void;
  toggleFolder: (path: string) => void;
  getFileTree: () => ProjectFile[];
  
  // SQL management
  addSQLSchema: (name: string, sql: string, tables: string[]) => void;
  deleteSQLSchema: (id: string) => void;
  
  // Backend connection
  setBackendConnection: (connection: BackendConnection) => void;
  disconnectBackend: () => void;
  
  // GitHub connection
  setGitHubConnection: (connection: GitHubConnection) => void;
  disconnectGitHub: () => void;
  setCurrentRepo: (repo: string) => void;
}

function buildFileTree(files: ProjectFile[]): ProjectFile[] {
  const tree: ProjectFile[] = [];
  const folderMap = new Map<string, ProjectFile>();
  
  // Sort files by path
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  
  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentPath = '';
    let currentLevel = tree;
    
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (currentPath ? '/' : '') + parts[i];
      
      let folder = folderMap.get(currentPath);
      if (!folder) {
        folder = {
          id: generateId(),
          path: currentPath,
          name: parts[i],
          content: '',
          language: '',
          type: 'folder',
          children: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        folderMap.set(currentPath, folder);
        currentLevel.push(folder);
      }
      currentLevel = folder.children!;
    }
    
    currentLevel.push({ ...file, name: parts[parts.length - 1] });
  }
  
  return tree;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      selectedFilePath: null,
      expandedFolders: new Set(['src', 'src/components', 'src/pages']),
      
      createProject: (name, description = '') => {
        const id = generateId();
        const newProject: Project = {
          id,
          name,
          description,
          files: [],
          sqlSchemas: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set(state => ({
          projects: [newProject, ...state.projects],
          currentProjectId: id,
        }));
        
        return id;
      },
      
      selectProject: (id) => {
        set({ currentProjectId: id, selectedFilePath: null });
      },
      
      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        }));
      },
      
      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find(p => p.id === currentProjectId) || null;
      },
      
      addFile: (path, content, language) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        const newFile: ProjectFile = {
          id: generateId(),
          path,
          name: path.split('/').pop() || path,
          content,
          language,
          type: 'file',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? {
                  ...p,
                  files: [...p.files.filter(f => f.path !== path), newFile],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },
      
      updateFile: (path, content) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? {
                  ...p,
                  files: p.files.map(f =>
                    f.path === path
                      ? { ...f, content, isModified: true, updatedAt: new Date().toISOString() }
                      : f
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },
      
      deleteFile: (path) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? {
                  ...p,
                  files: p.files.filter(f => !f.path.startsWith(path)),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },
      
      selectFile: (path) => {
        set({ selectedFilePath: path });
      },
      
      toggleFolder: (path) => {
        set(state => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(path)) {
            newExpanded.delete(path);
          } else {
            newExpanded.add(path);
          }
          return { expandedFolders: newExpanded };
        });
      },
      
      getFileTree: () => {
        const project = get().getCurrentProject();
        if (!project) return [];
        return buildFileTree(project.files);
      },
      
      addSQLSchema: (name, sql, tables) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        const newSchema: SQLSchema = {
          id: generateId(),
          name,
          sql,
          tables,
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, sqlSchemas: [...p.sqlSchemas, newSchema] }
              : p
          ),
        }));
      },
      
      deleteSQLSchema: (id) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, sqlSchemas: p.sqlSchemas.filter(s => s.id !== id) }
              : p
          ),
        }));
      },
      
      setBackendConnection: (connection) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, backendConnection: connection }
              : p
          ),
        }));
      },
      
      disconnectBackend: () => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, backendConnection: undefined }
              : p
          ),
        }));
      },
      
      setGitHubConnection: (connection) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, githubConnection: connection }
              : p
          ),
        }));
      },
      
      disconnectGitHub: () => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, githubConnection: undefined, currentRepo: undefined }
              : p
          ),
        }));
      },
      
      setCurrentRepo: (repo) => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;
        
        set(state => ({
          projects: state.projects.map(p =>
            p.id === currentProjectId
              ? { ...p, currentRepo: repo }
              : p
          ),
        }));
      },
    }),
    {
      name: 'jostavan-projects',
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
