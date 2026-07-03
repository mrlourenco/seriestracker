import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Spinner from './components/Spinner'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const SeriesList = lazy(() => import('./pages/SeriesList'))
const SeriesDetail = lazy(() => import('./pages/SeriesDetail'))
const AddEditSeries = lazy(() => import('./pages/AddEditSeries'))
const Shares = lazy(() => import('./pages/Shares'))
const Discover = lazy(() => import('./pages/Discover'))
const Top = lazy(() => import('./pages/Top'))

function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0E' }}>
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/top" element={<ProtectedRoute><Top /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/series" element={<ProtectedRoute><SeriesList /></ProtectedRoute>} />
        <Route path="/series/new" element={<ProtectedRoute><AddEditSeries /></ProtectedRoute>} />
        <Route path="/series/:id" element={<ProtectedRoute><SeriesDetail /></ProtectedRoute>} />
        <Route path="/series/:id/edit" element={<ProtectedRoute><AddEditSeries /></ProtectedRoute>} />
        <Route path="/shares" element={<ProtectedRoute><Shares /></ProtectedRoute>} />
        <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
