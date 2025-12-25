import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Customers from './pages/CustomersNew';
import CashBook from './pages/CashBook';
import MutasiValas from './pages/MutasiValasNew';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManual from './pages/UserManual';
import Layout from './components/Layout';
import { RefreshCw } from 'lucide-react';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#064E3B] to-[#022C22]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
      <div className="text-[#D4AF37] text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
        Memuat...
      </div>
    </div>
  </div>
);

// Error screen component
const ErrorScreen = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#064E3B] to-[#022C22]">
    <div className="text-center p-8 max-w-md">
      <div className="text-red-400 text-6xl mb-4">⚠️</div>
      <h2 className="text-[#D4AF37] text-2xl mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
        Koneksi Terputus
      </h2>
      <p className="text-[#FEF3C7]/70 mb-6">
        {error || 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#064E3B] rounded-lg font-semibold hover:bg-[#B8963A] transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        Coba Lagi
      </button>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading, error, retry } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={retry} />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, error, retry } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={retry} />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="customers" element={<Customers />} />
          <Route path="cashbook" element={<CashBook />} />
          <Route path="mutasi-valas" element={<MutasiValas />} />
          <Route path="reports" element={<Reports />} />
          <Route
            path="settings"
            element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;