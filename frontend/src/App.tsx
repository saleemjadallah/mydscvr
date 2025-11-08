import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from './lib/api';
import type { User } from './types';

// Pages
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import BatchViewPage from './pages/BatchViewPage';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authApi.me();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout user={user}><HomePage /></Layout>} />
        <Route path="/pricing" element={<Layout user={user}><PricingPage /></Layout>} />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" /> : <Layout user={user}><LoginPage onLogin={setUser} /></Layout>
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/dashboard" /> : <Layout user={user}><RegisterPage onRegister={setUser} /></Layout>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            user ? <Layout user={user}><DashboardPage user={user} /></Layout> : <Navigate to="/login" />
          }
        />
        <Route
          path="/upload"
          element={
            user ? <Layout user={user}><UploadPage user={user} /></Layout> : <Navigate to="/login" />
          }
        />
        <Route
          path="/processing"
          element={
            user ? <Layout user={user}><ProcessingPage /></Layout> : <Navigate to="/login" />
          }
        />
        <Route
          path="/batches/:batchId"
          element={
            user ? <Layout user={user}><BatchViewPage user={user} /></Layout> : <Navigate to="/login" />
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
