import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login          from './pages/Login';
import Register       from './pages/Register';
import ChangePassword from './pages/ChangePassword';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import UserDetail     from './pages/admin/UserDetail';
import AdminStores    from './pages/admin/Stores';

import BrowseStores   from './pages/user/BrowseStores';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerProfile   from './pages/owner/Profile';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')       return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'store_owner') return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/stores" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"         element={<RootRedirect />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users"     element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin']}><UserDetail /></ProtectedRoute>} />
            <Route path="/admin/stores"    element={<ProtectedRoute roles={['admin']}><AdminStores /></ProtectedRoute>} />

            {/* Normal user */}
            <Route path="/stores"          element={<ProtectedRoute roles={['user','admin']}><BrowseStores /></ProtectedRoute>} />

            {/* Change password for all roles */}
            <Route path="/change-password" element={<ProtectedRoute roles={['user','store_owner','admin']}><ChangePassword /></ProtectedRoute>} />

            {/* Store owner */}
            <Route path="/owner/dashboard" element={<ProtectedRoute roles={['store_owner']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/profile"   element={<ProtectedRoute roles={['store_owner']}><OwnerProfile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
