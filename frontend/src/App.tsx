import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
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
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
