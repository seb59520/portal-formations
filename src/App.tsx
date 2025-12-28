import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { CourseView } from './pages/CourseView'
import { ItemView } from './pages/ItemView'
import { AdminCourses } from './pages/admin/AdminCourses'
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit'
import { AdminItemEdit } from './pages/admin/AdminItemEdit'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Routes publiques */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ResetPassword />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées pour étudiants */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:itemId"
            element={
              <ProtectedRoute>
                <ItemView />
              </ProtectedRoute>
            }
          />

          {/* Routes admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items/:itemId/edit"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItemEdit />
              </ProtectedRoute>
            }
          />

          {/* Route par défaut */}
          <Route path="/" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
