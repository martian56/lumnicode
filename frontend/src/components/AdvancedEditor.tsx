import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import {
  Lightbulb,
  Bug,
  Zap,
  Code,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  X,
  FileText,
  FolderOpen,
  FolderPlus,
  Plus,
  Trash2,
  Save
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from '../lib/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface CodeSuggestion {
  code: string;
  explanation: string;
  confidence: number;
  language: string;
  line_start?: number;
  line_end?: number;
}

interface BugReport {
  type: 'bug' | 'security' | 'logic' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line: number;
  suggestion: string;
}

interface File {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface AdvancedEditorProps {
  projectId?: string;
  initialCode?: string;
  language?: string;
  onBack?: () => void;
  onCodeChange?: (code: string) => void;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  projectId,
  initialCode = '',
  language = 'javascript',
  onCodeChange,
  onBack
}) => {
  // File management state
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorBg, setEditorBg] = useState<string>(() => {
    try {
      return localStorage.getItem('editorBg') || '#0b1220';
    } catch {
      return '#0b1220';
    }
  });

  const colorOptions = ['#0b1220', '#0f1724', '#101827', '#071428', '#0b3b2e', '#1f2937'];

  const changeEditorBg = (color: string) => {
    setEditorBg(color);
    try {
      const monaco = monacoRef.current;
      if (monaco) {
        monaco.editor.defineTheme('custom-dynamic', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': color,
            'editorGutter.background': color,
            'editorWidget.background': color,
            'editorSuggestWidget.background': color
          }
        });
        monaco.editor.setTheme('custom-dynamic');
      }
      try { localStorage.setItem('editorBg', color); } catch {}
    } catch (err) { console.error('Failed to set theme', err); }
  };
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  // Folder support
  const [createInPath, setCreateInPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // keep refs used later to avoid unused variable lint during incremental edits
  void setCreateInPath;
  void expandedFolders;
  
  // Editor state
  const [code, setCode] = useState(initialCode);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  
  // AI features state
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [complexity, setComplexity] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'bugs' | 'metrics' | 'chat'>('suggestions');
  // Chat agent mode state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    setIsChatting(true);
    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    try {
      const token = await getToken();
  const response = await fetch(`${API_BASE}/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_content: code,
          cursor_position: cursorPosition,
          language: currentLanguage,
          prompt: `(${currentLanguage}) ${userText}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantText = data.suggestion || JSON.stringify(data);
        setChatMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
      } else {
        addToast('Assistant error', 'error');
      }
    } catch (err) {
      console.error('Chat error', err);
      addToast('Failed to contact assistant', 'error');
    } finally {
      setIsChatting(false);
    }
  };
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const inlineWidgetRef = useRef<any>(null);
  const [suggestionPreview, setSuggestionPreview] = useState<string | null>(null);
  const suggestionPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    suggestionPreviewRef.current = suggestionPreview;
  }, [suggestionPreview]);
  // Shared helper callable outside mount: accepts current suggestionPreviewRef at cursor
  const acceptSuggestionAtCursor = useCallback(() => {
    const text = suggestionPreviewRef.current;
    if (!text) return false;
    const editor = editorRef.current;
    if (!editor) return false;
    console.debug('[AdvancedEditor] acceptSuggestionAtCursor called, text length=', text.length);
    const position = editor.getPosition();
    if (!position) return false;
    editor.executeEdits('', [{
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      },
      text
    }]);
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    editor.setPosition({ lineNumber: position.lineNumber + lines.length - 1, column: (lines.length === 1 ? position.column + lastLine.length : lastLine.length + 1) });
    (editorRef as any).hideInlineSuggestion?.();
    setSuggestionPreview(null);
    console.debug('[AdvancedEditor] suggestion applied');
    return true;
  }, []);

  // Debug logging for suggestion preview changes
  useEffect(() => {
    if (suggestionPreview) {
      console.debug('[AdvancedEditor] suggestionPreview set (len):', suggestionPreview.length);
    } else {
      console.debug('[AdvancedEditor] suggestionPreview cleared');
    }
  }, [suggestionPreview]);

  // Document-level fallback key listener for Alt+Enter to accept suggestion when editor is focused
  useEffect(() => {
    const onDocKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'Enter') {
        if (!suggestionPreviewRef.current) return;
        try {
          const active = document.activeElement;
          const editorNode = editorRef.current && editorRef.current.getDomNode && editorRef.current.getDomNode();
          if (editorNode && editorNode.contains(active)) {
            e.preventDefault();
            console.debug('[AdvancedEditor] doc-level Alt+Enter detected, accepting suggestion');
            acceptSuggestionAtCursor();
          }
        } catch (err) {
          // ignore
        }
      }
    };

    document.addEventListener('keydown', onDocKey);
    return () => document.removeEventListener('keydown', onDocKey);
  }, [acceptSuggestionAtCursor]);

  const autosaveTimerRef = useRef<any>(null);
  const completionTimerRef = useRef<any>(null);
  const { getToken } = useAuth();
  // API base URL from Vite env, fallback to localhost
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

  // Load project and files on mount
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadFiles();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
      addToast('Failed to load project', 'error');
    }
  };

  const loadFiles = async () => {
    try {
      const token = await getToken();
      // backend expects project_id as a query param for listing files
      const response = await apiClient.get(`/files?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data);
      
      // Select first file if available
      if (response.data.length > 0 && !selectedFile) {
        setSelectedFile(response.data[0]);
        setCode(response.data[0].content);
        setCurrentLanguage(response.data[0].language || getLanguageFromFileName(response.data[0].name));
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      addToast('Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createFile = async () => {
    if (!newFileName.trim()) return;
    if (!projectId) {
      addToast('No project selected. Cannot create file.', 'error');
      return;
    }

    try {
      console.log('Creating file', { projectId, newFileName })
      const token = await getToken();
      // Build path using optional folder prefix
      const filePath = createInPath ? `${createInPath.replace(/\/$/, '')}/${newFileName}` : newFileName;
      const response = await apiClient.post(`/files`, {
        project_id: projectId,
        name: newFileName,
        path: filePath,
        content: '',
        language: getLanguageFromFileName(newFileName)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newFile = response.data;
      setFiles([...files, newFile]);
  setSelectedFile(newFile);
  setCode('');
  setCurrentLanguage(newFile.language || getLanguageFromFileName(newFile.name));
      setNewFileName('');
      setShowNewFileModal(false);
      addToast('File created successfully', 'success');
    } catch (error) {
      console.error('Failed to create file:', error);
      addToast('Failed to create file', 'error');
    }
  };

  // Create a folder by uploading a .gitkeep file into it
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    if (!projectId) {
      addToast('No project selected. Cannot create folder.', 'error');
      return;
    }

    try {
      const token = await getToken();
      const folderPath = newFolderName.replace(/\/$/, '');
      // Avoid creating duplicate .gitkeep files for the same folder
      const existing = files.find(f => (f.path || f.name) === `${folderPath}/.gitkeep`);
  let newFile: File | null = null;
      if (!existing) {
        const createPath = `${folderPath}/.gitkeep`;
        const response = await apiClient.post(`/files`, {
          project_id: projectId,
          name: '.gitkeep',
          path: createPath,
          content: '',
          language: 'text'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        newFile = response.data;
  if (newFile) setFiles(prev => [...prev, newFile as File]);
      } else {
        newFile = existing;
      }
      setNewFolderName('');
      addToast(`Folder '${folderPath}' created`, 'success');
      setExpandedFolders(prev => ({ ...prev, [folderPath]: true }));
    } catch (error) {
      console.error('Failed to create folder:', error);
      addToast('Failed to create folder', 'error');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const token = await getToken();
      await apiClient.delete(`/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      
      if (selectedFile?.id === fileId) {
        if (updatedFiles.length > 0) {
          setSelectedFile(updatedFiles[0]);
          setCode(updatedFiles[0].content);
          setCurrentLanguage(updatedFiles[0].language || getLanguageFromFileName(updatedFiles[0].name));
        } else {
          setSelectedFile(null);
          setCode('');
        }
      }
      
      addToast('File deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete file:', error);
      addToast('Failed to delete file', 'error');
    }
  };

  // Build a nested tree structure from files' paths
  const buildFileTree = (filesList: File[]) => {
    const root: any = { children: {}, files: [] };
    filesList.forEach((file) => {
      const parts = (file.path || file.name).split('/').filter(Boolean);
      if (parts.length === 1) {
        root.files.push(file);
      } else {
        let node = root;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          node.children[part] = node.children[part] || { children: {}, files: [], name: part, path: node.path ? `${node.path}/${part}` : part };
          node = node.children[part];
        }
        node.files.push(file);
      }
    });
    return root;
  };

  const getAllFolderPaths = (): string[] => {
    const set = new Set<string>();
    files.forEach(f => {
      const full = (f.path || f.name || '').replace(/\\/g, '/');
      const parts = full.split('/').filter(Boolean);
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts.slice(0, i + 1).join('/');
        set.add(p);
      }
    });
    return Array.from(set).sort();
  };

  const renderTree = (node: any, basePath = ''): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // Render folders first
    Object.keys(node.children || {}).sort().forEach((folderName) => {
      const child = node.children[folderName];
      const folderPath = basePath ? `${basePath}/${folderName}` : folderName;
      const isOpen = !!expandedFolders[folderPath];

      elements.push(
        <div key={folderPath} className="pl-0">
          <div className="flex items-center justify-between p-1 rounded hover:bg-gray-700/30">
            <div className="flex items-center space-x-2 flex-1">
              <button
                onClick={() => setExpandedFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] }))}
                className={`w-4 h-4 flex items-center justify-center rounded transition-transform ${isOpen ? 'rotate-90' : ''} text-gray-300 hover:text-white`}
                aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
              >
                ▸
              </button>
              <FolderOpen className="w-4 h-4 opacity-80" />
              <span className="text-sm truncate">{folderName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); setCreateInPath(folderPath); setShowNewFileModal(true); }}
                className="p-1 text-xs rounded bg-gray-700/30 hover:bg-gray-700/50 text-gray-200"
                title="New file in this folder"
              >
                New file
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="pl-4">
              {/* Render nested folders/files */}
              {renderTree(child, folderPath)}
            </div>
          )}
        </div>
      );
    });

    // Render files at this level (root files)
    if (node.files && node.files.length > 0) {
      node.files.sort((a: File, b: File) => a.name.localeCompare(b.name)).forEach((file: File) => {
        const key = file.id;
        elements.push(
          <div
            key={key}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group transition-all duration-200 ${
              selectedFile?.id === file.id
                ? 'bg-gray-700/50 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
            }`}
          >
            <div
              className="flex items-center space-x-2 flex-1 min-w-0"
              onClick={() => {
                    setSelectedFile(file);
                    setCode(file.content);
                    setCurrentLanguage(file.language || getLanguageFromFileName(file.name));
                  }}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{file.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={file.path ? file.path.replace(/\\/g, '/') : ''}
                onChange={async (e) => {
                  e.stopPropagation();
                  const newPath = e.target.value || file.name;
                  try {
                    const token = await getToken();
                    await apiClient.put(`/files/${file.id}`, { path: newPath }, { headers: { Authorization: `Bearer ${token}` } });
                    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, path: newPath } : f));
                    addToast('File moved', 'success');
                  } catch (err) {
                    console.error('Move file failed', err);
                    addToast('Failed to move file', 'error');
                  }
                }}
                className="bg-transparent text-xs border border-gray-700/20 rounded p-1 text-gray-300"
                title="Move file to folder"
              >
                <option value="">(root)</option>
                {getAllFolderPaths().map(fp => (
                  <option key={fp} value={`${fp}/${file.name}`}>{fp}</option>
                ))}
              </select>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      });
    }

    return elements;
  };


  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust'
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  // Extract code from AI suggestion text: prefer triple-backtick blocks, fall back to raw text
  const extractCodeFromSuggestion = (suggestion: string | undefined | null) => {
    if (!suggestion) return '';
    // Look for fenced code block
    const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/m;
    const m = suggestion.match(codeBlockRegex);
    if (m && m[1]) return m[1].trim();

    // If no fenced block, try to heuristically extract the last code-like section
    // Split by lines and find contiguous lines that look like code (contain semicolons, braces, or typical keywords)
    const lines = suggestion.split('\n');
    let codeLines: string[] = [];
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i].trim();
      if (!ln) continue;
      // heuristics for code-like lines
      if (/[;{}=<>\(\)\[\]"'`]|\bconsole\.|\breturn\b|\bfunction\b|\bclass\b/.test(ln)) {
        codeLines.unshift(lines[i]);
      } else {
        // stop if we already collected some code lines
        if (codeLines.length > 0) break;
      }
    }
    if (codeLines.length > 0) return codeLines.join('\n').trim();

    // fallback: return the full suggestion trimmed
    return suggestion.trim();
  };

  // Very small heuristic to detect the language of a returned code snippet
  const detectLanguageFromCode = (snippet: string): string | null => {
    if (!snippet || !snippet.trim()) return null;
    const s = snippet;

    // Python hints
    if (/^\s*def\s+\w+\s*\(/m.test(s) || /\bself\b/.test(s) || /\bimport\s+\w+/m.test(s) || /^\s*print\(/m.test(s) || /^\s*#/.test(s)) return 'python';

    // JavaScript/TypeScript hints
    if (/console\.log\b/.test(s) || /\bfunction\b/.test(s) || /=>/.test(s) || /\bconst\b|\blet\b|\bvar\b/.test(s) || /module\.exports|export\s+default/.test(s)) return 'javascript';
    if (/interface\s+\w+/.test(s) || (/:\s*\w+/m.test(s) && /export/.test(s))) return 'typescript';

    // HTML/CSS
    if (/^\s*</m.test(s) && /<\w+/.test(s)) return 'html';
    if (/^[\s\S]*\{[\s\S]*\}/.test(s) && /:\s*[^;]+;/.test(s)) return 'css';

    // C/C++/Java hints
    if (/#include\s+<|#include\s+"/.test(s) || /printf\(|std::/.test(s)) return 'c';
    if (/public\s+class\s+\w+/.test(s) || /System\.out\.println\(/.test(s)) return 'java';

    // Fallback: look for comment style
    if (/^\s*\/\//m.test(s)) return 'javascript';

    return null;
  };

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Inline suggestion widget helper
    const createWidgetDom = (text: string, langBadge?: string) => {
      const el = document.createElement('div');
      el.className = 'inline-suggestion text-gray-400 text-sm select-none flex items-center space-x-2';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.9';
      el.style.whiteSpace = 'pre';
      el.style.background = 'transparent';
      el.style.padding = '0 6px';
      const span = document.createElement('span');
      span.textContent = text;

      // Language badge (subtle)
      if (langBadge) {
        const badge = document.createElement('span');
        badge.textContent = langBadge;
        badge.style.opacity = '0.7';
        badge.style.marginLeft = '6px';
        badge.style.fontSize = '11px';
        badge.style.background = 'rgba(255,255,255,0.03)';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '4px';
        badge.style.border = '1px solid rgba(255,255,255,0.02)';
        el.appendChild(badge);
      }

      const hint = document.createElement('span');
      hint.textContent = 'Alt+Enter';
      hint.style.opacity = '0.6';
      hint.style.marginLeft = '8px';
      hint.style.fontSize = '11px';
      hint.style.background = 'rgba(255,255,255,0.03)';
      hint.style.padding = '2px 6px';
      hint.style.borderRadius = '4px';
      el.appendChild(span);
      el.appendChild(hint);
      return el;
    };

    const showInlineSuggestion = (text: string, lang?: string) => {
      if (!editorRef.current || !monacoRef.current) return;
      hideInlineSuggestion();

      const widget = {
        getId: () => 'inlineSuggestion.widget',
        getDomNode: () => createWidgetDom(text, lang),
        getPosition: () => ({
          position: editorRef.current.getPosition(),
          preference: [monacoRef.current.editor.ContentWidgetPositionPreference.EXACT]
        })
      };

      inlineWidgetRef.current = widget;
      editorRef.current.addContentWidget(widget);
    };

    const hideInlineSuggestion = () => {
      try {
        if (inlineWidgetRef.current && editorRef.current) {
          editorRef.current.removeContentWidget(inlineWidgetRef.current);
        }
      } catch (err) {
        // ignore
      }
      inlineWidgetRef.current = null;
    };

    // Expose helpers for other functions
  (editorRef as any).showInlineSuggestion = showInlineSuggestion;
    (editorRef as any).hideInlineSuggestion = hideInlineSuggestion;

    // Apply initial editor background theme
    try {
      monaco.editor.defineTheme('custom-dynamic', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': editorBg,
          'editorGutter.background': editorBg,
          'editorWidget.background': editorBg,
          'editorSuggestWidget.background': editorBg
        }
      });
      monaco.editor.setTheme('custom-dynamic');
    } catch (err) {
      // ignore theme errors
    }

    // (Hook logic and acceptSuggestionAtCursor moved to top-level to avoid invalid hook calls)

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
      // Hide preview when cursor moves
      (editorRef as any).hideInlineSuggestion?.();
      setSuggestionPreview(null);
    });

    // Key handling: accept suggestion on Tab using the shared accept helper
    editor.onKeyDown((e: any) => {
      const monaco = monacoRef.current;
      if (!monaco) return;

      // Tab key - accept if suggestion present
      if (e.keyCode === monaco.KeyCode.Tab && suggestionPreviewRef.current) {
        e.preventDefault();
        acceptSuggestionAtCursor();
      }
    });

    // Register a dedicated Monaco command for Ctrl/Cmd+Enter to accept suggestion (more reliable in browser)
    try {
      const monaco = monacoRef.current;
      if (monaco && typeof monaco.KeyMod !== 'undefined' && typeof monaco.KeyCode !== 'undefined') {
        // Use Alt+Enter to accept suggestion (closer to Copilot)
        editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
          if (!suggestionPreviewRef.current) return;
          acceptSuggestionAtCursor();
        });
      }
    } catch (err) {
      // ignore if monaco not available or addCommand fails
    }

  }, [suggestionPreview]);

  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);

    // Debounced autosave: 1.5s after user stops typing
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      // Only autosave if a file is open
      if (selectedFile) {
        console.debug('[AdvancedEditor] Autosave triggered for file:', selectedFile.id);
        try {
          saveFile(true);
        } catch (err) {
          console.error('[AdvancedEditor] Autosave saveFile threw error:', err);
        }
      } else {
        console.debug('[AdvancedEditor] Autosave skipped: no selectedFile');
      }
    }, 1500);

    // Debounced inline completion preview: 700ms after typing stops
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    completionTimerRef.current = setTimeout(() => {
      // Only trigger completion when there is content and not already completing
      if (!newCode.trim()) return;
      if ((isCompleting as any) === true) return;
      try {
        getCompletion();
      } catch (err) {
        console.error('getCompletion threw', err);
      }
    }, 700);
  }, [onCodeChange, selectedFile]);

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    try {
      const token = await getToken();
  const response = await fetch(`${API_BASE}/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_content: code,
          cursor_position: cursorPosition,
          language: currentLanguage,
          prompt: `Analyze the following ${currentLanguage} code and provide suggestions, bugs, and complexity metrics.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Try to parse structured analysis response
        try {
          const analysisResult = JSON.parse(data.suggestion);
          
          // Update suggestions if available
          if (analysisResult.suggestions && Array.isArray(analysisResult.suggestions)) {
            setSuggestions(analysisResult.suggestions.map((suggestion: any) => ({
              code: extractCodeFromSuggestion(suggestion.code || suggestion.text || ''),
              explanation: suggestion.explanation || suggestion.description || 'AI suggestion',
              confidence: suggestion.confidence || 0.8,
              language: currentLanguage,
              line_start: suggestion.line_start,
              line_end: suggestion.line_end
            })));
          }
          
          // Update bugs if available
          if (analysisResult.bugs && Array.isArray(analysisResult.bugs)) {
            setBugs(analysisResult.bugs.map((bug: any) => ({
              line: bug.line || 1,
              type: bug.type || 'logic',
              severity: bug.severity || 'medium',
              description: bug.description || bug.message || 'Potential issue detected',
              suggestion: bug.suggestion || bug.fix || 'Consider reviewing this code'
            })));
          }
          
          // Update complexity metrics if available
          if (analysisResult.complexity) {
            setComplexity(analysisResult.complexity);
          }
          
          addToast('Code analysis completed successfully', 'success');
        } catch (parseError) {
          // If parsing fails, treat as simple text response
          setSuggestions([{
            code: data.suggestion,
            explanation: 'AI-generated suggestion',
            confidence: 0.8,
            language: currentLanguage
          }]);
          addToast('Code analysis completed', 'success');
        }
      } else {
        throw new Error('Failed to analyze code');
      }
    } catch (error) {
      addToast('Failed to analyze code. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion: CodeSuggestion) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();

    if (suggestion.line_start && suggestion.line_end) {
      // Replace specific lines
      const range = {
        startLineNumber: suggestion.line_start,
        startColumn: 1,
        endLineNumber: suggestion.line_end,
        endColumn: model.getLineLength(suggestion.line_end) + 1
      };
      editor.executeEdits('', [{
        range,
        text: suggestion.code
      }]);
    } else {
      // Insert at cursor
      const position = editor.getPosition();
      editor.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: suggestion.code
      }]);
    }

    addToast('Suggestion applied to your editor.', 'success');
  };

  const getCompletion = async () => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    const position = editor.getPosition();

    // Get text before cursor
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    setIsCompleting(true);
    try {
      const token = await getToken();
  const response = await fetch(`${API_BASE}/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_content: textUntilPosition,
          cursor_position: cursorPosition,
          language: currentLanguage,
          prompt: `Complete the following ${currentLanguage} code.`
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Handle structured completion response
        let completionCode = data.suggestion;
        try {
          const completionResult = JSON.parse(data.suggestion);
          completionCode = completionResult.code || completionResult.completion || data.suggestion;
        } catch {
          // Use raw suggestion if parsing fails
        }

        completionCode = extractCodeFromSuggestion(completionCode);

        // Heuristic: detect language of returned snippet and if it mismatches, retry once asking for explicit language
        const detected = detectLanguageFromCode(completionCode);
        if (detected && detected !== currentLanguage) {
          console.debug('[AdvancedEditor] Detected language mismatch:', detected, 'expected:', currentLanguage);
          // Try one retry asking assistant to produce output in the requested language
          try {
            const retryResp = await fetch(`${API_BASE}/assist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                file_content: textUntilPosition,
                cursor_position: cursorPosition,
                language: currentLanguage,
                prompt: `Please provide the completion in ${currentLanguage} only. Complete the following code:`
              })
            });
            if (retryResp.ok) {
              const retryData = await retryResp.json();
              let retryCode = retryData.suggestion;
              try { const parsed = JSON.parse(retryData.suggestion); retryCode = parsed.code || parsed.completion || retryData.suggestion; } catch {}
              retryCode = extractCodeFromSuggestion(retryCode);
              // If retry yields something, use it
              if (retryCode && retryCode.trim()) {
                completionCode = retryCode;
              }
            }
          } catch (retryErr) {
            console.debug('[AdvancedEditor] Retry failed', retryErr);
          }
        }

        // Instead of immediately applying, show an inline preview and let user accept with Tab
        setSuggestionPreview(completionCode);
        const langForBadge = detectLanguageFromCode(completionCode) || currentLanguage;
        (editorRef as any).showInlineSuggestion?.(completionCode, langForBadge);
        addToast('Code completion ready — press Tab to accept', 'info');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Completion error:', error);
      addToast('Failed to get code completion.', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  const refactorCode = async (type: string = 'general') => {
    if (!code.trim()) return;

    setIsRefactoring(true);
    try {
      const token = await getToken();
  const response = await fetch(`${API_BASE}/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_content: code,
          cursor_position: cursorPosition,
          language: currentLanguage,
          prompt: `Refactor the following ${currentLanguage} code with ${type} improvements.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle structured refactoring response
    let refactoredCode = data.suggestion;
  let explanation = "AI code refactoring";
        
        try {
          const refactorResult = JSON.parse(data.suggestion);
          refactoredCode = refactorResult.code || refactorResult.refactored_code || data.suggestion;
          explanation = refactorResult.explanation || refactorResult.description || "AI code refactoring";
        } catch {
          // Use raw suggestion if parsing fails
        }
        
        applySuggestion({
          code: extractCodeFromSuggestion(refactoredCode),
          explanation: explanation,
          confidence: 0.8,
          language: currentLanguage
        });
        addToast('Code refactoring applied', 'success');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Refactoring error:', error);
      addToast('Failed to refactor code.', 'error');
    } finally {
      setIsRefactoring(false);
    }
  };

  const explainCode = async () => {
    if (!code.trim()) return;

    setIsExplaining(true);
    try {
      const token = await getToken();
  const response = await fetch(`${API_BASE}/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_content: code,
          cursor_position: cursorPosition,
          language: currentLanguage,
          prompt: `Explain the following ${currentLanguage} code in detail.`
        })
      });

      if (response.ok) {
        const data = await response.json();
        let explanation = data.suggestion;
        try {
          const explanationResult = JSON.parse(data.suggestion);
          explanation = explanationResult.explanation || explanationResult.description || data.suggestion;
        } catch {
          // Use raw suggestion if parsing fails
        }
        // Strip code blocks from the explanation to avoid polluting the message
        const explanationText = extractCodeFromSuggestion(explanation) || explanation;
        addToast(`Code Explanation: ${explanationText}`, 'info');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Explanation error:', error);
      addToast('Failed to explain code.', 'error');
    } finally {
      setIsExplaining(false);
    }
  };

  const saveFile = async (quiet: boolean = false) => {
    if (!selectedFile) return;
    // Prefer the editor's current value to avoid React state staleness
    const contentToSave = editorRef.current?.getValue?.() ?? code;
    console.debug('[AdvancedEditor] saveFile called', { fileId: selectedFile.id, quiet, contentLength: contentToSave?.length });
    setSaving(true);
    try {
      const token = await getToken();
      await apiClient.put(`/files/${selectedFile.id}`, {
        content: contentToSave
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update the file in state with the actual saved content
      const updatedFiles = files.map(f =>
        f.id === selectedFile.id ? { ...f, content: contentToSave } : f
      );
      setFiles(updatedFiles);
      setSelectedFile({ ...selectedFile, content: contentToSave });

      if (!quiet) {
        addToast('File saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      if (!quiet) addToast('Failed to save file', 'error');
    } finally {
      setSaving(false);
    }
  };


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Code copied to clipboard.', 'success');
    } catch (error) {
      addToast('Failed to copy to clipboard.', 'error');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-400/50';
      case 'high': return 'bg-orange-500/20 border-orange-400/50';
      case 'medium': return 'bg-yellow-500/20 border-yellow-400/50';
      case 'low': return 'bg-blue-500/20 border-blue-400/50';
      default: return 'bg-gray-500/20 border-gray-400/50';
    }
  };

  const getBugIcon = (type: string) => {
    switch (type) {
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'logic': return <Bug className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  return (
  <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Toolbar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-700/50 backdrop-blur-xl bg-gray-900/80 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              {/* Back to Dashboard button */}
              <button
                title="Back to Dashboard"
                onClick={() => { if (typeof (onBack as any) === 'function') { (onBack as any)(); } else { window.history.back(); } }}
                className="mr-2 p-1 rounded bg-gray-800/60 hover:bg-gray-700/70 border border-gray-700/40 text-gray-200"
              >
                ←
              </button>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gray-700/50 border border-gray-600/50 text-xs rounded-lg text-gray-200">
              {currentLanguage}
            </span>
            <span className="text-sm text-gray-400">
              Line {cursorPosition.line}, Col {cursorPosition.column}
            </span>
          </div>
          {selectedFile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-300">{selectedFile.name}</span>
            </div>
          )}
          {project?.name && (
            <div className="ml-4 text-sm text-gray-300">Project: {project.name}</div>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-sm rounded-lg flex items-center space-x-2 text-gray-200 hover:text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={analyzeCode}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            <span>Analyze</span>
          </button>

          <button
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-sm rounded-lg flex items-center space-x-2 text-gray-200 hover:text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={getCompletion}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Complete</span>
          </button>

          <button
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-sm rounded-lg flex items-center space-x-2 text-gray-200 hover:text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => refactorCode()}
            disabled={isRefactoring}
          >
            {isRefactoring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Code className="w-4 h-4" />
            )}
            <span>Refactor</span>
          </button>

          <button
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-sm rounded-lg flex items-center space-x-2 text-gray-200 hover:text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={explainCode}
            disabled={isExplaining}
          >
            {isExplaining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            <span>Explain</span>
          </button>

          <div className="w-px h-8 bg-gray-600/50"></div>
          
          <button
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-sm rounded-lg flex items-center space-x-2 text-gray-200 hover:text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => saveFile()}
            disabled={saving || !selectedFile}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save</span>
          </button>
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-300">Editor BG</label>
            <select
              value={editorBg}
              onChange={(e) => changeEditorBg(e.target.value)}
              className="bg-gray-800/50 border border-gray-600/50 text-sm rounded p-1 text-white"
            >
              {colorOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 border-r border-gray-700/50 backdrop-blur-xl bg-gray-900/80 relative z-10">
          <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>Files</span>
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Inline Create Folder toggle + input */}
                  {showNewFolderInput ? (
                    <div className="flex items-center space-x-2">
                      <input
                        id="inline-create-folder"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="folder/name"
                        className="p-1 pl-2 pr-2 bg-gray-800/50 border border-gray-600/50 rounded text-white placeholder-gray-500 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            createFolder();
                          } else if (e.key === 'Escape') {
                            setShowNewFolderInput(false);
                            setNewFolderName('');
                          }
                        }}
                      />
                      <button
                        onClick={() => { createFolder(); }}
                        className="px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded border border-gray-600/50 text-sm"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }}
                        className="p-1 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowNewFileModal(true)}
                        className="p-1 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                        title="New File"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowNewFolderInput(true)}
                        className="p-1 hover:bg-gray-700/50 rounded text-gray-400 hover:text-white transition-colors"
                        title="New Folder"
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
          </div>
          
          <div className="overflow-y-auto h-full">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="mt-4">
                  <h4 className="text-sm text-gray-200 mb-2">Create folder</h4>
                  <div className="flex space-x-2">
                    <input id="create-folder-input" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="folder/name" className="flex-1 p-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500" />
                    <button onClick={createFolder} className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded border border-gray-600/50">Create</button>
                  </div>
                </div>
                <p className="text-sm">No files yet</p>
                <p className="text-xs mt-1">Create your first file</p>
              </div>
            ) : (
              <div className="p-2">
                {renderTree(buildFileTree(files))}
              </div>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Editor
            height="100%"
            language={currentLanguage}
            value={code}
            onChange={handleCodeChange}
            onMount={(editor, monaco) => handleEditorDidMount(editor, monaco)}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              }
            }}
          />
        </div>

        {/* AI Panel */}
        <div className="w-96 border-l border-gray-700/50 backdrop-blur-xl bg-gray-900/80 relative z-10 hidden lg:block">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700/50 backdrop-blur-sm">
            <button
              className={`flex-1 px-4 py-3 text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                activeTab === 'suggestions'
                  ? 'bg-gray-700/50 text-white border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              onClick={() => setActiveTab('suggestions')}
            >
              <Lightbulb className="w-4 h-4" />
              <span>AI</span>
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-gray-700/50 text-white border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              onClick={() => setActiveTab('chat' as any)}
            >
              <Sparkles className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                activeTab === 'bugs'
                  ? 'bg-gray-700/50 text-white border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              onClick={() => setActiveTab('bugs')}
            >
              <Bug className="w-4 h-4" />
              <span>Issues</span>
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                activeTab === 'metrics'
                  ? 'bg-gray-700/50 text-white border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
              onClick={() => setActiveTab('metrics')}
            >
              <Zap className="w-4 h-4" />
              <span>Metrics</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {isAnalyzing && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Analyzing code...</p>
                    <p className="text-xs text-gray-400">AI is processing your code for suggestions and issues</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                {suggestions.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <Lightbulb className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">No suggestions yet</p>
                    <p className="text-xs mt-1">Click "Analyze" to get AI suggestions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:bg-gray-700/50 transition-all duration-200 hover:shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-gray-700/50 border border-gray-600/50 px-3 py-1 rounded-lg text-gray-200">
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </span>
                          <button
                            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
                            onClick={() => copyToClipboard(suggestion.code)}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-200 mb-3 leading-relaxed">
                          {suggestion.explanation}
                        </p>
                        <div className="bg-black/30 border border-gray-700/50 rounded-lg p-3 mb-3">
                          <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                            <code>{suggestion.code}</code>
                          </pre>
                        </div>
                        <button
                          className="w-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-200 hover:text-white text-sm py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          Apply Suggestion
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bugs' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                {bugs.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-sm font-medium">No issues detected</p>
                    <p className="text-xs mt-1">Your code looks good!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bugs.map((bug, index) => (
                      <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:bg-gray-700/50 transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${getSeverityColor(bug.severity).replace('bg-', 'bg-').replace('-500', '-500/20')} border border-gray-600/50`}>
                              {getBugIcon(bug.type)}
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-lg text-white border ${getSeverityColor(bug.severity).replace('bg-', 'border-').replace('-500', '-400/50')} ${getSeverityColor(bug.severity).replace('bg-', 'text-').replace('-500', '-100')}`}>
                              {bug.severity}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                            Line {bug.line}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200 mb-3 leading-relaxed">
                          {bug.description}
                        </p>
                        <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-3">
                          <p className="text-xs text-gray-300">
                            💡 {bug.suggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'chat' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                <div className="flex flex-col h-96">
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-900/30 rounded">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 py-6">Start a conversation with the assistant</div>
                    ) : (
                      chatMessages.map((m, i) => (
                        <div key={i} className={`p-2 rounded ${m.role === 'assistant' ? 'bg-gray-800/50' : 'bg-gray-700/30'}`}>
                          <div className="text-xs text-gray-300 mb-1">{m.role}</div>
                          <div className="text-sm text-gray-200 whitespace-pre-wrap">{m.text}</div>
                          {m.role === 'assistant' && (
                            <div className="mt-2 flex space-x-2">
                              <button
                                className="text-sm px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded"
                                onClick={() => {
                                  const code = extractCodeFromSuggestion(m.text);
                                  if (!code) { addToast('No code block found in assistant message', 'error'); return; }
                                  applySuggestion({ code, explanation: 'Applied from chat', confidence: 0.9, language: currentLanguage });
                                }}
                              >
                                Apply
                              </button>
                              <button
                                className="text-sm px-2 py-1 bg-gray-700/30 hover:bg-gray-600/30 rounded"
                                onClick={() => {
                                  navigator.clipboard?.writeText(m.text || '');
                                  addToast('Assistant message copied', 'success');
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-2">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      rows={3}
                      className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded text-white placeholder-gray-500"
                      placeholder="Ask the assistant to refactor, explain, or make edits..."
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          sendChatMessage();
                        }
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => sendChatMessage()}
                        className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-sm"
                        disabled={isChatting || !chatInput.trim()}
                      >
                        {isChatting ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'metrics' && (
              <div className="animate-in slide-in-from-right-5 duration-300">
                {complexity ? (
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-4 text-gray-200 flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Complexity Analysis</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Lines of Code</p>
                          <p className="text-lg font-semibold text-white">{complexity.total_lines}</p>
                        </div>
                        <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Functions</p>
                          <p className="text-lg font-semibold text-white">{complexity.functions}</p>
                        </div>
                        <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Complexity Score</p>
                          <p className="text-lg font-semibold text-white">{complexity.complexity_score}/100</p>
                        </div>
                        <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Maintainability</p>
                          <span className={`text-xs px-3 py-1 rounded-lg text-white border ${
                            complexity.maintainability === 'high'
                              ? 'bg-green-500/20 border-green-400/50'
                              : complexity.maintainability === 'medium'
                              ? 'bg-yellow-500/20 border-yellow-400/50'
                              : 'bg-red-500/20 border-red-400/50'
                          }`}>
                            {complexity.maintainability}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-4 text-gray-200 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Code Quality</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
                          <span className="text-sm text-gray-200">Bugs Detected</span>
                          <span className={`text-xs px-3 py-1 rounded-lg text-white border ${
                            bugs.length === 0
                              ? 'bg-green-500/20 border-green-400/50'
                              : 'bg-red-500/20 border-red-400/50'
                          }`}>
                            {bugs.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
                          <span className="text-sm text-gray-200">AI Suggestions</span>
                          <span className="text-xs bg-gray-600/50 border border-gray-500/50 px-3 py-1 rounded-lg text-gray-200">
                            {suggestions.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <Zap className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">No metrics available</p>
                    <p className="text-xs mt-1">Run code analysis to see metrics</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg backdrop-blur-md border transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-900/80 border-green-500/50 text-green-100'
                : toast.type === 'error'
                ? 'bg-red-900/80 border-red-500/50 text-red-100'
                : 'bg-gray-900/80 border-gray-500/50 text-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-current hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter file name (e.g., index.js)"
              className="w-full p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  createFile();
                } else if (e.key === 'Escape') {
                  setShowNewFileModal(false);
                  setNewFileName('');
                }
              }}
              autoFocus
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={createFile}
                disabled={!newFileName.trim()}
                className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFileModal(false);
                  setNewFileName('');
                }}
                className="flex-1 border border-gray-600/50 text-gray-300 hover:text-white hover:bg-gray-700/30 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};