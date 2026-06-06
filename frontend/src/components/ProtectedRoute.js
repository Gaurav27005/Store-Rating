import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar'; // <-- Crucial: Imports your Sidebar navigation

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  // 1. If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if the user has the required role for this specific page
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'store_owner') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/stores" replace />;
  }

  // 3. Render the component WITH the Sidebar and Layout wrappers restored
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}