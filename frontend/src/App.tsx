import { BrowserRouter as Router, Routes, Route, useParams, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { HelmetProvider } from 'react-helmet-async'
import LandingPage from './components/LandingPage'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectsPage from './components/ProjectsPage'
import SettingsPage from './components/SettingsPage'
import HelpPage from './components/HelpPage'
import APIKeyManager from './components/APIKeyManager'
import ProjectCreationPage from './components/ProjectCreationPage'
import { AdvancedEditor } from './components/AdvancedEditor'

const AdvancedEditorWrapper = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const state = location.state as any;
  
  return (
    <AdvancedEditor 
      projectId={projectId} 
      aiPrompt={state?.aiPrompt}
      techStack={state?.techStack}
      autoStartAI={state?.autoStartAI}
    />
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SignedOut>
            <LandingPage />
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="api-keys" element={<APIKeyManager />} />
              </Route>
              <Route path="/create-project" element={<ProjectCreationPage />} />
              <Route path="/project/:projectId" element={<AdvancedEditorWrapper />} />
              <Route path="/editor/:projectId" element={<AdvancedEditorWrapper />} />
            </Routes>
          </SignedIn>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
