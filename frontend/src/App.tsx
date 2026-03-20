import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import EvaluationPage from './pages/EvaluationPage'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDashboard from './pages/ProjectDashboard'
import ProtocolPage from './pages/ProtocolPage'
import ScreeningPage from './pages/ScreeningPage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import MiningPage from './pages/MiningPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/evaluation" element={<EvaluationPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated app */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDashboard />} />
            <Route path="/projects/:projectId/protocol" element={<ProtocolPage />} />
            <Route path="/projects/:projectId/screening" element={<ScreeningPage />} />
            <Route path="/projects/:projectId/results" element={<ResultsPage />} />
            <Route path="/projects/:projectId/analytics" element={<AnalyticsPage />} />
            <Route path="/projects/:projectId/mining" element={<MiningPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
