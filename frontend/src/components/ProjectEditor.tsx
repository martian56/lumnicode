import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import Editor from '@monaco-editor/react'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  Trash2, 
  Sparkles,
  Code,
  ArrowRight
} from 'lucide-react'
import { apiClient } from '../lib/api'

interface File {
  id: string
  name: string
  path: string
  content: string
  language: string
}

interface Project {
  id: string
  name: string
  description?: string
}

export default function ProjectEditor() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiAssisting, setAiAssisting] = useState(false)
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  useEffect(() => {
    if (projectId) {
      loadProject()
      loadFiles()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProject(response.data)
    } catch (error) {
      console.error('Failed to load project:', error)
      navigate('/')
    }
  }

  const loadFiles = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.get(`/files?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(response.data)
      if (response.data.length > 0 && !selectedFile) {
        setSelectedFile(response.data[0])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveFile = async () => {
    if (!selectedFile) return
    
    setSaving(true)
    try {
      const token = await getToken()
      await apiClient.put(
        `/files/${selectedFile.id}`,
        { content: selectedFile.content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (error) {
      console.error('Failed to save file:', error)
    } finally {
      setSaving(false)
    }
  }

  const createFile = async () => {
    if (!newFileName.trim() || !projectId) return

    const fileData = {
      name: newFileName,
      path: newFileName,
      content: '',
      language: getLanguageFromFileName(newFileName),
      project_id: projectId
    }
    
    console.log('Creating file with data:', fileData)
    console.log('projectId type:', typeof projectId, 'value:', projectId)

    try {
      const token = await getToken()
      const response = await apiClient.post(
        '/files/',
        fileData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const newFile = response.data
      setFiles([...files, newFile])
      setSelectedFile(newFile)
      setNewFileName('')
      setShowNewFileModal(false)
    } catch (error) {
      console.error('Failed to create file:', error)
      console.error('Error response:', (error as any)?.response?.data)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const token = await getToken()
      await apiClient.delete(`/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const updatedFiles = files.filter(f => f.id !== fileId)
      setFiles(updatedFiles)
      
      if (selectedFile?.id === fileId) {
        setSelectedFile(updatedFiles.length > 0 ? updatedFiles[0] : null)
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const runAiAssist = async () => {
    if (!selectedFile) return

    setAiAssisting(true)
    try {
      const token = await getToken()
      const response = await apiClient.post(
        '/assist',
        {
          file_content: selectedFile.content,
          cursor_position: null, // TODO: Get actual cursor position from Monaco
          prompt: 'Help me improve this code'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // For now, just show the suggestion in a simple alert
      // In a real app, you'd integrate this better with the editor
      alert(`AI suggestion: ${response.data.suggestion}`)
    } catch (error) {
      console.error('Failed to get AI assistance:', error)
    } finally {
      setAiAssisting(false)
    }
  }

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      setSelectedFile({ ...selectedFile, content: value })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 animate-pulse">Loading your project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-slate-700/50"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-base sm:text-lg">
                  {project?.name || 'Project'}
                </h1>
                <p className="text-slate-400 text-xs hidden sm:block">AI-Powered Code Editor</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={runAiAssist}
              disabled={!selectedFile || aiAssisting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-purple-500/25"
            >
              <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 ${aiAssisting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{aiAssisting ? 'AI Thinking...' : 'AI Assist'}</span>
              <span className="sm:hidden">{aiAssisting ? 'AI...' : 'AI'}</span>
            </button>
            
            <button
              onClick={saveFile}
              disabled={!selectedFile || saving}
              className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-emerald-500/25"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
              <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 sm:w-72 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
          <div className="p-3 sm:p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex items-center space-x-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>Project Files</span>
              </h3>
              <button
                onClick={() => setShowNewFileModal(true)}
                className="text-slate-400 hover:text-white transition-all duration-200 p-1.5 rounded-lg hover:bg-slate-700/50 group"
              >
                <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="text-xs text-slate-400">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {files.length === 0 ? (
              <div className="p-6 text-center animate-fade-in-up">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-3xl p-8 w-fit mx-auto mb-8 backdrop-blur-xl border border-slate-700/50 hover-lift">
                  <FileText className="mx-auto h-16 w-16 text-slate-500 mb-4" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">No files yet</h4>
                <p className="text-slate-400 text-lg mb-8 max-w-sm mx-auto leading-relaxed">
                  Create your first file and start coding with AI-powered assistance and intelligent suggestions.
                </p>
                <button
                  onClick={() => setShowNewFileModal(true)}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2 mx-auto font-medium"
                >
                  <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                  <span>Create Your First File</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group transition-all duration-300 hover:scale-102 ${
                      selectedFile?.id === file.id
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-md transition-all duration-300 group-hover:scale-110 ${
                        selectedFile?.id === file.id
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-700/50 text-slate-400 group-hover:text-slate-300 group-hover:bg-slate-600/50'
                      }`}>
                        <FileText className="h-4 w-4 flex-shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block group-hover:text-purple-300 transition-colors">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-500 capitalize group-hover:text-slate-400 transition-colors">
                          {file.language}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFile(file.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-1 rounded hover:bg-red-500/10 hover:scale-110"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 px-4 sm:px-6 py-2 sm:py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base truncate">{selectedFile.name}</span>
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md capitalize hidden sm:inline">
                      {selectedFile.language}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="hidden sm:inline">AI-Enhanced Editor</span>
                    <span className="sm:hidden">AI Editor</span>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={selectedFile.language}
                  value={selectedFile.content}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace",
                    fontWeight: "400",
                    lineHeight: 1.6,
                    cursorBlinking: "smooth",
                    renderLineHighlight: "gutter",
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
                <div className="absolute bottom-4 right-4">
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 border border-slate-700/50">
                    <div className="flex items-center space-x-2">
                      <span>Lines: {selectedFile.content.split('\n').length}</span>
                      <span>•</span>
                      <span>Size: {new Blob([selectedFile.content]).size} bytes</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Code className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to Code</h3>
                <p className="text-slate-400 max-w-sm">
                  Select a file from the sidebar to start editing with AI-powered assistance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 w-full max-w-md mx-auto border border-slate-700/50 shadow-2xl animate-slide-in-right">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-2 sm:p-3 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Create New File</h3>
                <p className="text-slate-400 text-sm">Start coding with AI assistance</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 backdrop-blur-xl transition-all duration-200 focus:scale-105 text-base"
                  placeholder="example.js"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-2">
                  Include the file extension to enable syntax highlighting
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-6 py-3 text-slate-300 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 hover:text-white transition-all duration-200 hover:scale-105 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={createFile}
                disabled={!newFileName.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 hover:scale-105 font-medium order-1 sm:order-2"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}