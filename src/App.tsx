import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { NetworkStatus } from './components/NetworkStatus'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { CourseView } from './pages/CourseView'
import { ProgramView } from './pages/ProgramView'
import { ItemView } from './pages/ItemView'
import { Help } from './pages/Help'
import { AdminCourses } from './pages/admin/AdminCourses'
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit'
import { AdminCourseEditJson } from './pages/admin/AdminCourseEditJson'
import { AdminCourseEnrollments } from './pages/admin/AdminCourseEnrollments'
import { AdminCourseSubmissions } from './pages/admin/AdminCourseSubmissions'
import { AdminItemEdit } from './pages/admin/AdminItemEdit'
import { AdminItemEditJson } from './pages/admin/AdminItemEditJson'
import { AdminChapterEditJson } from './pages/admin/AdminChapterEditJson'
import { AdminItems } from './pages/admin/AdminItems'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminOrgs } from './pages/admin/AdminOrgs'
import { AdminUnified } from './pages/admin/AdminUnified'
import { AdminPrograms } from './pages/admin/AdminPrograms'
import { AdminProgramEdit } from './pages/admin/AdminProgramEdit'
import { AdminProgramEnrollments } from './pages/admin/AdminProgramEnrollments'
import { TrainerDashboard } from './pages/trainer/TrainerDashboard'
import { SessionLearners } from './pages/trainer/SessionLearners'
import { SessionAnalytics } from './pages/trainer/SessionAnalytics'
import { ExerciseResults } from './pages/trainer/ExerciseResults'
import { TrainerNotes } from './pages/trainer/TrainerNotes'
import { TrainerRouteGuard } from './components/trainer/TrainerRouteGuard'
import { Profile } from './pages/Profile'
import { DebugProfile } from './pages/DebugProfile'
import { DiagnosticRole } from './pages/DiagnosticRole'

function App() {
  return (
    <AuthProvider>
      <NetworkStatus />
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
            path="/programs/:programId"
            element={
              <ProtectedRoute>
                <ProgramView />
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
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug-profile"
            element={
              <ProtectedRoute>
                <DebugProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic-role"
            element={
              <ProtectedRoute>
                <DiagnosticRole />
              </ProtectedRoute>
            }
          />

          {/* Routes admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUnified />
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
            path="/admin/courses/:courseId/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/new/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/enrollments"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEnrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/submissions"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItems />
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
          <Route
            path="/admin/items/:itemId/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItemEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items/new/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItemEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chapters/:chapterId/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminChapterEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chapters/new/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminChapterEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orgs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminOrgs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs/:programId"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProgramEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs/:programId/enrollments"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProgramEnrollments />
              </ProtectedRoute>
            }
          />

          {/* Routes formateur */}
          <Route
            path="/trainer"
            element={
              <TrainerRouteGuard>
                <TrainerDashboard />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId"
            element={
              <TrainerRouteGuard>
                <SessionLearners />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/analytics/:sessionId"
            element={
              <TrainerRouteGuard>
                <SessionAnalytics />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId/exercise/:exerciseId/results"
            element={
              <TrainerRouteGuard>
                <ExerciseResults />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/notes"
            element={
              <TrainerRouteGuard>
                <TrainerNotes />
              </TrainerRouteGuard>
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
