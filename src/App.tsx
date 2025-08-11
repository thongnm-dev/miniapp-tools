import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './stores/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/LoginPage';
import S3ManagerPage from './pages/S3ManagerPage';
import S3Upload from './pages/S3UploadPage';
import ErrorBoundary from './components/ErrorBoundary';
import WorkDirectoryPage from './pages/WorkDirectoryPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/DashboardPage';
import S3TranLogDetail from './pages/S3TranLogDetailPage';
import S3DownloadPage from './pages/S3DownloadPage';
import WelcomePage from './pages/WelcomePage';
import BugManagePage from './pages/BugManagePage';
import BugDetailPage from './pages/BugDetailPage';
import CopyFilePage from './pages/CopyFilePage';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />

                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/welcome" element={
                            <WelcomePage />
                        } />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Dashboard />
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/s3-manager" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <S3ManagerPage />
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/s3-upload" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <S3Upload />
                                </MainLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/s3-download" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <S3DownloadPage />
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/bugs" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <BugManagePage />
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/bugs/:id" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <BugDetailPage />
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                        <Route path="/s3-tran-log/:id" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <S3TranLogDetail />
                                </MainLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/work-directory" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <WorkDirectoryPage />
                                </MainLayout>
                            </ProtectedRoute>
                        } />

                        <Route path="/copy-tools" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <CopyFilePage />
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                        {/* Redirect to dashboard for root path */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Navigate to="/dashboard" replace />
                            </ProtectedRoute>
                        }
                        />

                        {/* Redirect to login for unknown routes */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App; 