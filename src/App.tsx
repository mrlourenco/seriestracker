import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SeriesList from './pages/SeriesList'
import SeriesDetail from './pages/SeriesDetail'
import AddEditSeries from './pages/AddEditSeries'
import Shares from './pages/Shares'
import Discover from './pages/Discover'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/series" element={<ProtectedRoute><SeriesList /></ProtectedRoute>} />
      <Route path="/series/new" element={<ProtectedRoute><AddEditSeries /></ProtectedRoute>} />
      <Route path="/series/:id" element={<ProtectedRoute><SeriesDetail /></ProtectedRoute>} />
      <Route path="/series/:id/edit" element={<ProtectedRoute><AddEditSeries /></ProtectedRoute>} />
      <Route path="/shares" element={<ProtectedRoute><Shares /></ProtectedRoute>} />
      <Route path="/discover" element={<Discover />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
