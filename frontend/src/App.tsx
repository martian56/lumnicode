import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
// import ProjectEditor from './components/ProjectEditor'
import { AdvancedEditor } from './components/AdvancedEditor'

const AdvancedEditorWrapper = () => {
  const { projectId } = useParams();
  return <AdvancedEditor projectId={projectId} />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <SignedOut>
          <LandingPage />
        </SignedOut>
        <SignedIn>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:projectId" element={<AdvancedEditorWrapper />} />
          </Routes>
        </SignedIn>
      </div>
    </Router>
  )
}

export default App
